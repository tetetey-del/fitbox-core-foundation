import { Link } from "@tanstack/react-router";
import { CalendarDays, Ticket } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useDataVersion } from "@/lib/data-bus";
import { bookingsRepo } from "@/lib/storage/repositories/bookings.repo";
import { classSessionsRepo } from "@/lib/storage/repositories/classSessions.repo";
import { classTemplatesRepo } from "@/lib/storage/repositories/classTemplates.repo";
import { hasSessionStarted } from "@/lib/services/booking.service";
import { getActiveMembership, getPlan } from "@/lib/services/membership.service";
import { formatLongDay } from "@/lib/date";

/** Saludo del socio arriba del Feed, con el color del box: próxima clase y clases disponibles. */
export function MemberHero() {
  const { currentUser } = useAuth();
  useDataVersion();
  if (!currentUser || currentUser.role !== "member") return null;

  const next = bookingsRepo
    .query({ userId: currentUser.id })
    .filter((b) => b.status === "confirmed")
    .map((b) => classSessionsRepo.getById(b.sessionId))
    .filter((s): s is NonNullable<typeof s> => !!s && s.status !== "cancelled" && !hasSessionStarted(s))
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))[0];
  const tpl = next ? classTemplatesRepo.getById(next.templateId) : null;

  const membership = getActiveMembership(currentUser.id);
  const plan = membership ? getPlan(membership.planId) : null;
  const credits =
    !plan ? "Sin plan activo"
    : plan.type === "credits"
      ? `${membership?.creditsRemaining ?? 0} ${membership?.creditsRemaining === 1 ? "clase disponible" : "clases disponibles"}`
      : "Clases ilimitadas";

  const first = currentUser.name.split(" ")[0];

  return (
    <section
      className="relative mb-6 overflow-hidden rounded-2xl p-5 text-white"
      style={{ background: "linear-gradient(135deg, var(--brand), color-mix(in srgb, var(--brand) 40%, #0E2A3A))" }}
    >
      <div aria-hidden className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
      <div aria-hidden className="absolute -bottom-12 right-12 h-28 w-28 rounded-full bg-white/10" />
      <div className="relative">
        <div className="text-2xl font-semibold">¡Hola, {first}!</div>
        <div className="mt-3 flex items-start gap-2 text-sm">
          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
          {next ? (
            <span>
              Tu próxima clase: <strong>{tpl?.name ?? "Clase"}</strong>
              <span className="block opacity-90 first-letter:uppercase">
                {formatLongDay(next.date)} · {next.startTime} h
              </span>
            </span>
          ) : (
            <span>No tienes clases reservadas.</span>
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            to="/reservas"
            className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-[#0E2A3A] shadow-sm"
          >
            {next ? "Ver reservas" : "Reservar una clase"}
          </Link>
          <Link
            to="/membresia"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-sm font-medium backdrop-blur-sm"
          >
            <Ticket className="h-3.5 w-3.5" strokeWidth={2} />
            {credits}
          </Link>
        </div>
      </div>
    </section>
  );
}
