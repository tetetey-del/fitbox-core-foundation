import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

const CONSENT_KEY = "fitbox:cookie_consent";
const CONSENT_VERSION = 1;

interface Consent {
  version: number;
  technical: true;
  preferences: boolean;
  analytics: boolean;
  decidedAt: string;
}

function readConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Consent;
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeConsent(c: Omit<Consent, "version" | "technical" | "decidedAt">) {
  const full: Consent = {
    version: CONSENT_VERSION,
    technical: true,
    ...c,
    decidedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(CONSENT_KEY, JSON.stringify(full));
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [openPrefs, setOpenPrefs] = useState(false);
  const [prefs, setPrefs] = useState({ preferences: true, analytics: false });

  useEffect(() => {
    if (!readConsent()) setVisible(true);
  }, []);

  if (!visible) return null;

  const acceptAll = () => {
    writeConsent({ preferences: true, analytics: true });
    setVisible(false);
  };
  const rejectAll = () => {
    writeConsent({ preferences: false, analytics: false });
    setVisible(false);
  };
  const savePrefs = () => {
    writeConsent(prefs);
    setOpenPrefs(false);
    setVisible(false);
  };

  return (
    <>
      <div
        role="dialog"
        aria-label="Aviso de cookies"
        className="fixed bottom-4 inset-x-4 md:inset-x-auto md:right-4 md:max-w-md z-50 rounded-lg border border-border bg-background/95 backdrop-blur shadow-2xl p-4"
      >
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-md bg-[#14B8A6]/10 text-[#14B8A6] flex items-center justify-center shrink-0">
            <Cookie className="h-4 w-4" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">Cookies en FitBox</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Usamos cookies técnicas necesarias y, si aceptas, cookies de preferencia y analítica para mejorar tu
              experiencia. Consulta la{" "}
              <Link to="/legal/cookies" className="underline underline-offset-2 hover:text-foreground">
                política de cookies
              </Link>
              .
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={acceptAll}>Aceptar todas</Button>
              <Button size="sm" variant="outline" onClick={rejectAll}>Rechazar</Button>
              <Button size="sm" variant="ghost" onClick={() => setOpenPrefs(true)}>Preferencias</Button>
            </div>
          </div>
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={rejectAll}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <Dialog open={openPrefs} onOpenChange={setOpenPrefs}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Preferencias de cookies</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <PrefRow
              title="Técnicas"
              desc="Necesarias para el funcionamiento básico. No se pueden desactivar."
              checked
              disabled
            />
            <PrefRow
              title="Preferencia"
              desc="Recuerdan tus opciones (tema, idioma…) para futuras visitas."
              checked={prefs.preferences}
              onChange={(v) => setPrefs((p) => ({ ...p, preferences: v }))}
            />
            <PrefRow
              title="Analítica"
              desc="Nos ayudan a entender cómo se usa FitBox. Datos anónimos."
              checked={prefs.analytics}
              onChange={(v) => setPrefs((p) => ({ ...p, analytics: v }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpenPrefs(false)}>Cancelar</Button>
            <Button onClick={savePrefs}>Guardar preferencias</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PrefRow({
  title,
  desc,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-border p-3">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}
