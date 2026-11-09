import { useState } from "react";
import { toast } from "sonner";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { notifyDataChanged, useDataVersion } from "@/lib/data-bus";
import { createLocation, deleteLocation, listLocations, updateLocation } from "@/lib/services/locations.service";
import { planOf } from "@/lib/plans";
import { UpgradeDialog } from "@/components/plan/UpgradeDialog";
import type { Location } from "@/types";
import { currentTerms } from "@/lib/placeTerms";

/** Configuración → Sedes. Pro: hasta 2; Business: las que quieras. */
export function LocationsSection() {
  useDataVersion();
  const { currentTenant } = useAuth();
  const plan = planOf(currentTenant);
  const locations = listLocations();
  const count = Math.max(1, locations.length);
  const [editing, setEditing] = useState<Location | "new" | null>(null);
  const [upgrade, setUpgrade] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Location | null>(null);

  const add = () => {
    if (plan.maxLocations !== null && count >= plan.maxLocations) setUpgrade(true);
    else setEditing("new");
  };

  return (
    <section id="sedes" className="scroll-mt-20 space-y-4 rounded-lg border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Sedes</h2>
          <p className="text-sm text-muted-foreground">
            {locations.length <= 1
              ? `Tu ${currentTerms().place} tiene una sola sede. Si abres otra, agrégala aquí: cada clase tendrá su sede y los socios podrán reservar en cualquiera.`
              : `${locations.length} sedes. Las clases y los socios tienen su sede; los planes y el ${currentTerms().wod} son los mismos para todas.`}
          </p>
        </div>
        <Button variant="outline" onClick={add}>
          <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} /> Agregar sede
        </Button>
      </div>

      {locations.length > 0 && (
        <ul className="divide-y divide-border rounded-md border border-border">
          {locations.map((l, i) => (
            <li key={l.id} className="flex items-center justify-between gap-3 p-3">
              <div className="flex min-w-0 items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} style={{ color: "var(--brand)" }} />
                <div className="min-w-0">
                  <div className="text-sm font-medium">
                    {l.name}
                    {i === 0 && <span className="ml-2 text-xs font-normal text-muted-foreground">principal</span>}
                  </div>
                  {l.address && <div className="truncate text-xs text-muted-foreground">{l.address}</div>}
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" aria-label="Editar sede" onClick={() => setEditing(l)}>
                  <Pencil className="h-4 w-4" strokeWidth={1.5} />
                </Button>
                {i > 0 && (
                  <Button size="icon" variant="ghost" aria-label="Borrar sede" onClick={() => setConfirmDelete(l)}>
                    <Trash2 className="h-4 w-4 text-destructive" strokeWidth={1.5} />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">
        Tu plan {plan.name} incluye {plan.maxLocations === null ? "sedes ilimitadas" : plan.maxLocations === 1 ? "1 sede" : `hasta ${plan.maxLocations} sedes`}.
      </p>

      <LocationDialog
        open={editing !== null}
        initial={editing === "new" ? null : editing}
        onOpenChange={(o) => !o && setEditing(null)}
        onSave={(data) => {
          if (editing === "new") createLocation(data, currentTenant?.name ?? "");
          else if (editing) updateLocation(editing.id, data);
          toast.success("Sede guardada");
          notifyDataChanged();
          setEditing(null);
        }}
      />

      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Borrar {confirmDelete?.name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Sus clases y sus socios pasan a la sede principal. No se borra ninguna clase ni reserva.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!confirmDelete) return;
                const { moved } = deleteLocation(confirmDelete.id);
                toast.success(moved ? `Sede borrada · ${moved} clases pasaron a la principal` : "Sede borrada");
                notifyDataChanged();
                setConfirmDelete(null);
              }}
            >
              Borrar sede
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UpgradeDialog
        target={plan.id === "starter" ? "pro" : "business"}
        open={upgrade}
        onOpenChange={setUpgrade}
        title={plan.id === "starter" ? "El plan Starter incluye 1 sede" : "El plan Pro incluye hasta 2 sedes"}
        body={
          plan.id === "starter"
            ? "Con el plan Pro puedes tener hasta 2 sedes, con sus clases y sus socios, en un mismo panel."
            : "Para más de 2 sedes está el plan Business (99 €/mes), con sedes ilimitadas en un solo panel. Escríbeme y lo vemos."
        }
      />
    </section>
  );
}

function LocationDialog({
  open,
  initial,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  initial: Location | null;
  onOpenChange: (o: boolean) => void;
  onSave: (d: { name: string; address?: string }) => void;
}) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [lastKey, setLastKey] = useState<string | null>(null);
  const key = open ? initial?.id ?? "new" : null;
  if (key !== lastKey) {
    setLastKey(key);
    setName(initial?.name ?? "");
    setAddress(initial?.address ?? "");
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar sede" : "Nueva sede"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Nombre</Label>
            <Input value={name} placeholder="Ej. Sede Centro" onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Dirección (opcional)</Label>
            <Input value={address} placeholder="Calle y número" onChange={(e) => setAddress(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={!name.trim()} onClick={() => onSave({ name, address })}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
