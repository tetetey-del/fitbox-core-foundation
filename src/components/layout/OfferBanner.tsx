import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useDataVersion, notifyDataChanged } from "@/lib/data-bus";
import { bookingsRepo } from "@/lib/storage/repositories/bookings.repo";
import { classSessionsRepo } from "@/lib/storage/repositories/classSessions.repo";
import { classTemplatesRepo } from "@/lib/storage/repositories/classTemplates.repo";
import { expireOffers, respondOffer } from "@/lib/services/booking.service";
import { cloudRespondOffer, isCloudSession } from "@/lib/cloud/bookings";
import { pullChanges } from "@/lib/cloud/sync";

/**
 * Cartel arriba de todo cuando a un socio se le ofrece un lugar de la lista de espera:
 * cuenta regresiva y botones "Confirmar" / "No, gracias".
 */
export function OfferBanner() {
  const { currentUser } = useAuth();
  const version = useDataVersion();
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState<string | null>(null);

  // Reloj de la cuenta regresiva; en la demo, además vence las ofertas.
  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
      if (!isCloudSession() && expireOffers() > 0) notifyDataChanged();
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const offers = useMemo(() => {
    if (!currentUser || currentUser.role !== "member") return [];
    return bookingsRepo
      .query({ userId: currentUser.id })
      .filter((b) => b.status === "offered" && b.offerExpiresAt)
      .map((b) => {
        const s = classSessionsRepo.getById(b.sessionId);
        const tpl = s ? classTemplatesRepo.getById(s.templateId) : null;
        return { b, s, tpl };
      })
      .filter((x) => !!x.s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, version]);

  // Box real: cuando se vence una oferta, traer el estado nuevo del servidor.
  const anyExpired = offers.some(({ b }) => new Date(b.offerExpiresAt!).getTime() <= now);
  useEffect(() => {
    if (anyExpired && isCloudSession()) void pullChanges().catch(() => {});
  }, [anyExpired]);

  if (offers.length === 0) return null;

  const answer = async (bookingId: string, accept: boolean) => {
    setBusy(bookingId);
    const res = isCloudSession() ? await cloudRespondOffer(bookingId, accept) : respondOffer(bookingId, accept);
    setBusy(null);
    notifyDataChanged();
    if (!res.ok) toast.error(res.reason ?? "No se pudo responder");
    else if (accept) toast.success("¡Listo! Tienes tu lugar en la clase.");
    else toast("Liberaste el lugar para la siguiente persona.");
  };

  return (
    <div className="mb-4 space-y-2">
      {offers.map(({ b, s, tpl }) => {
        const left = Math.max(0, new Date(b.offerExpiresAt!).getTime() - now);
        const mm = Math.floor(left / 60_000);
        const ss = Math.floor((left % 60_000) / 1000).toString().padStart(2, "0");
        const [, m, d] = s!.date.split("-");
        return (
          <div key={b.id} className="rounded-lg border border-[#A3E635]/50 bg-[#A3E635]/10 p-3">
            <div className="flex items-start gap-3">
              <PartyPopper className="h-5 w-5 shrink-0 text-[#A3E635]" strokeWidth={1.75} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">¡Se liberó un lugar!</div>
                <div className="text-sm">
                  {tpl?.name ?? "Clase"} · {d}/{m} · {s!.startTime} h
                </div>
                <div className="text-xs text-muted-foreground">
                  {left > 0 ? (
                    <>Confírmalo en <span className="font-mono font-semibold text-foreground">{mm}:{ss}</span> o pasará a la siguiente persona.</>
                  ) : (
                    "Se venció el plazo…"
                  )}
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" className="flex-1" disabled={busy === b.id || left <= 0} onClick={() => answer(b.id, true)}>
                {busy === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
              </Button>
              <Button size="sm" variant="outline" className="flex-1" disabled={busy === b.id || left <= 0} onClick={() => answer(b.id, false)}>
                No, gracias
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
