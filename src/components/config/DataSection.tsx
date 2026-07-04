import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  BackupValidationError,
  downloadBackup,
  exportTenantData,
  importTenantData,
  readBackupFile,
  type ImportResult,
} from "@/lib/services/backup.service";

export function DataSection() {
  const { currentTenant, _setSession } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [pending, setPending] = useState<ImportResult | null>(null);

  if (!currentTenant) return null;

  const handleExport = () => {
    try {
      const payload = exportTenantData(currentTenant.id);
      downloadBackup(payload);
      toast.success("Backup descargado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo exportar");
    }
  };

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const payload = await readBackupFile(file);
      const result = importTenantData(payload);
      toast.success(`Box importado: ${payload.tenant.name}`);
      setPending(result);
    } catch (err) {
      if (err instanceof BackupValidationError) {
        toast.error(err.message);
      } else {
        toast.error("No se pudo importar el archivo");
        console.error(err);
      }
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const enterImported = () => {
    if (pending && pending.ownerId) {
      const s = {
        tenantId: pending.newTenantId,
        userId: pending.ownerId,
        role: "admin" as const,
      };
      // Sesión directa: es el mismo admin, ya autenticado.
      import("@/lib/storage/session").then(({ sessionStore }) => {
        sessionStore.write(s);
        _setSession(s);
        navigate({ to: "/dashboard" });
      });
    }
    setPending(null);
  };

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-6">
      <div>
        <h2 className="text-base font-semibold">Backup y datos</h2>
        <p className="text-sm text-muted-foreground">
          Exporta todo el box a un archivo JSON o importa uno recibido de otro FitBox.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" strokeWidth={1.5} />
          Exportar box
        </Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          <Upload className="h-4 w-4 mr-2" strokeWidth={1.5} />
          Importar box
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-label="Seleccionar archivo de backup"
          onChange={(e) => handleImport(e.target.files?.[0])}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        El importado se crea como un box nuevo (no sobreescribe el actual).
      </p>

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Box importado correctamente</AlertDialogTitle>
            <AlertDialogDescription>
              {pending && (
                <span className="block space-y-1 text-xs">
                  <span className="block">Se han importado:</span>
                  {Object.entries(pending.counts).map(([k, v]) => (
                    <span key={k} className="block">• {k}: {v}</span>
                  ))}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Quedarme aquí</AlertDialogCancel>
            <AlertDialogAction onClick={enterImported} disabled={!pending?.ownerId}>
              Entrar en el box importado
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
