import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BellRing, Loader2, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { disablePush, enablePush, getPushState, type PushState } from "@/lib/cloud/push";
import { isCloudSession } from "@/lib/cloud/bookings";

const DISMISS_KEY = "kinflow:push-prompt-dismissed";

function usePushState() {
  const [state, setState] = useState<PushState | null>(null);
  useEffect(() => {
    if (!isCloudSession()) {
      setState("unsupported");
      return;
    }
    void getPushState().then(setState).catch(() => setState("unsupported"));
  }, []);
  return [state, setState] as const;
}

async function turnOn(setState: (s: PushState) => void, setBusy: (b: boolean) => void) {
  setBusy(true);
  try {
    const s = await enablePush();
    setState(s);
    if (s === "on") toast.success("¡Listo! Te avisaremos en el móvil.");
    else if (s === "denied") toast.error("Has bloqueado las notificaciones. Puedes activarlas en los ajustes del navegador o del móvil.");
  } catch {
    toast.error("No se pudieron activar las notificaciones. Inténtalo de nuevo.");
  } finally {
    setBusy(false);
  }
}

function InstallHint() {
  return (
    <p className="text-xs text-muted-foreground">
      En el iPhone, los avisos llegan solo con la app en la pantalla de inicio: toca{" "}
      <Share className="inline h-3.5 w-3.5 -mt-0.5" strokeWidth={1.75} /> <strong>Compartir</strong> →{" "}
      <strong>Añadir a pantalla de inicio</strong>, y abre la app desde ese ícono.
    </p>
  );
}

/** Aviso (una vez) para que el socio active las notificaciones. */
export function PushPrompt() {
  const { currentUser } = useAuth();
  const [state, setState] = usePushState();
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });
  if (!currentUser || currentUser.role !== "member" || dismissed) return null;
  if (state !== "off" && state !== "ios-needs-install") return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* nada */
    }
    setDismissed(true);
  };

  return (
    <div className="mb-4 rounded-lg border border-border bg-card p-3">
      <div className="flex items-start gap-3">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: "color-mix(in srgb, var(--brand) 18%, transparent)", color: "var(--brand)" }}
        >
          <BellRing className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="text-sm font-medium">¿Te avisamos en el móvil?</div>
          <p className="text-xs text-muted-foreground">
            Por ejemplo, cuando se libera un lugar en una clase en la que estás en lista de espera.
          </p>
          {state === "ios-needs-install" ? (
            <InstallHint />
          ) : (
            <div className="flex gap-2">
              <Button size="sm" disabled={busy} onClick={() => turnOn(setState, setBusy)}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Activar avisos"}
              </Button>
              <Button size="sm" variant="ghost" onClick={dismiss}>Ahora no</Button>
            </div>
          )}
        </div>
        <button type="button" aria-label="Cerrar" onClick={dismiss} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}

/** Sección de Mi cuenta para activar o desactivar las notificaciones en este móvil. */
export function PushSettings() {
  const [state, setState] = usePushState();
  const [busy, setBusy] = useState(false);
  if (!isCloudSession() || state === null || state === "unsupported") return null;

  return (
    <div className="space-y-2">
      {state === "on" && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm">Activadas en este dispositivo.</span>
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await disablePush().catch(() => {});
              setState("off");
              setBusy(false);
            }}
          >
            Desactivar
          </Button>
        </div>
      )}
      {state === "off" && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">Recibe en el móvil los avisos de lista de espera y de clases canceladas.</span>
          <Button size="sm" disabled={busy} onClick={() => turnOn(setState, setBusy)}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Activar avisos"}
          </Button>
        </div>
      )}
      {state === "denied" && (
        <p className="text-sm text-muted-foreground">
          Las notificaciones están bloqueadas. Actívalas en los ajustes del móvil o del navegador para Kinflow.
        </p>
      )}
      {state === "ios-needs-install" && <InstallHint />}
    </div>
  );
}
