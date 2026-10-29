import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, ChevronRight, Copy, Rocket, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useDataVersion } from "@/lib/data-bus";
import { boxLink } from "@/lib/boxBrand";
import { membershipPlansRepo } from "@/lib/storage/repositories/membershipPlans.repo";
import { classTemplatesRepo } from "@/lib/storage/repositories/classTemplates.repo";
import { classSessionsRepo } from "@/lib/storage/repositories/classSessions.repo";
import { wodsRepo } from "@/lib/storage/repositories/wods.repo";
import { postsRepo } from "@/lib/storage/repositories/posts.repo";
import { toDateKey } from "@/lib/date";
import { cn } from "@/lib/utils";

const sharedKey = (tenantId: string) => `kinflow:link-compartido:${tenantId}`;
const hiddenKey = (tenantId: string) => `kinflow:primeros-pasos-oculto:${tenantId}`;

function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeFlag(key: string): void {
  try {
    localStorage.setItem(key, "1");
  } catch {
    /* nada */
  }
}

/** Marca que el dueño ya copió el link de la app (para "Primeros pasos"). */
export function markLinkShared(tenantId: string): void {
  writeFlag(sharedKey(tenantId));
}

interface Step {
  id: string;
  title: string;
  hint: string;
  done: boolean;
  to: string;
  hash?: string;
}

/** Lista de primeros pasos para un box nuevo. Desaparece cuando está todo hecho (o al ocultarla). */
export function GettingStarted() {
  useDataVersion();
  const { currentTenant, tenantUsers, currentUser } = useAuth();
  const [hidden, setHidden] = useState(true);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    if (!currentTenant) return;
    setHidden(readFlag(hiddenKey(currentTenant.id)));
    setShared(readFlag(sharedKey(currentTenant.id)));
  }, [currentTenant]);

  if (!currentTenant || currentUser?.role !== "admin" || hidden) return null;

  const today = toDateKey(new Date());
  const steps: Step[] = [
    {
      id: "marca",
      title: "Pon el logo y el color de tu box",
      hint: "Es también el ícono de la app que instalan tus socios.",
      done: !!currentTenant.logo,
      to: "/configuracion",
      hash: "apariencia",
    },
    {
      id: "planes",
      title: "Crea tus planes y precios",
      hint: "Por ejemplo: clase de prueba, 8 clases, pase libre.",
      done: membershipPlansRepo.list().some((p) => p.active),
      to: "/configuracion",
      hash: "planes",
    },
    {
      id: "clases",
      title: "Crea tus clases y genera el horario",
      hint: "Primero las plantillas (CrossFit, Movilidad…), después \"Generar sesiones\".",
      done: classTemplatesRepo.list().length > 0 && classSessionsRepo.list().some((s) => s.date >= today),
      to: "/clases",
    },
    {
      id: "socios",
      title: "Invita a tus primeros socios",
      hint: "Desde Socios → Invitar, o dales de alta tú y asígnales un plan.",
      done: tenantUsers.some((u) => u.role === "member"),
      to: "/socios",
    },
    {
      id: "wod",
      title: "Publica el primer WOD o un aviso",
      hint: "Tus socios lo ven en el Feed.",
      done: wodsRepo.list().length > 0 || postsRepo.list().length > 0,
      to: "/clases",
      hash: "wod",
    },
    {
      id: "link",
      title: "Comparte el link de tu app",
      hint: "Con tu logo y tu nombre; tus socios la agregan a la pantalla de inicio.",
      done: shared,
      to: "/configuracion",
      hash: "link-app",
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(boxLink(currentTenant.slug));
      markLinkShared(currentTenant.id);
      setShared(true);
      toast.success("Link copiado", { description: "Pégalo en WhatsApp, Instagram o donde hables con tus socios." });
    } catch {
      toast.error("No se pudo copiar el link");
    }
  };

  const pct = Math.round((doneCount / steps.length) * 100);

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: "color-mix(in srgb, var(--brand) 18%, transparent)", color: "var(--brand)" }}
        >
          <Rocket className="h-4.5 w-4.5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold">Primeros pasos</h2>
          <p className="text-xs text-muted-foreground">
            {doneCount} de {steps.length} hechos. Cuando termines, tu box está listo para tus socios.
          </p>
          <div className="mt-2 h-1.5 rounded-full bg-muted">
            <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: "var(--brand)" }} />
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground"
          aria-label="Ocultar primeros pasos"
          onClick={() => {
            writeFlag(hiddenKey(currentTenant.id));
            setHidden(true);
          }}
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </Button>
      </div>

      <ul className="mt-4 divide-y divide-border">
        {steps.map((s) => (
          <li key={s.id} className="flex items-center gap-3 py-2.5">
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                s.done ? "border-transparent text-white" : "border-border",
              )}
              style={s.done ? { backgroundColor: "var(--brand)" } : undefined}
            >
              {s.done && <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
            </span>
            <div className="min-w-0 flex-1">
              <div className={cn("text-sm font-medium", s.done && "text-muted-foreground line-through")}>{s.title}</div>
              {!s.done && <div className="text-xs text-muted-foreground">{s.hint}</div>}
            </div>
            {!s.done &&
              (s.id === "link" ? (
                <Button size="sm" variant="outline" onClick={copyLink}>
                  <Copy className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} /> Copiar
                </Button>
              ) : (
                <Button size="sm" variant="outline" asChild>
                  <Link to={s.to} hash={s.hash}>
                    Ir <ChevronRight className="ml-0.5 h-3.5 w-3.5" strokeWidth={1.75} />
                  </Link>
                </Button>
              ))}
          </li>
        ))}
      </ul>
    </section>
  );
}
