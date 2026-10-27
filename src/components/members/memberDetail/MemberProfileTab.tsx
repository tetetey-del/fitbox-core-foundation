import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usersRepo } from "@/lib/storage/repositories/users.repo";
import { notifyDataChanged } from "@/lib/data-bus";
import { formatDate } from "@/lib/date";
import type { User } from "@/types";

/** Bloque de datos personales editables del socio dentro del detalle. */
export function MemberProfileTab({ user }: { user: User }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);

  const saveEdit = () => {
    if (!name.trim() || !email.trim()) return toast.error("Nombre y email son obligatorios");
    usersRepo.update(user.id, { name: name.trim(), email: email.trim() });
    toast.success("Datos actualizados");
    notifyDataChanged();
    setEditing(false);
  };

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Datos personales</h3>
        {!editing ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setName(user.name);
              setEmail(user.email);
              setEditing(true);
            }}
          >
            Editar
          </Button>
        ) : (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
            <Button size="sm" onClick={saveEdit}>Guardar</Button>
          </div>
        )}
      </div>
      {editing ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">
          Alta: {formatDate(user.createdAt.slice(0, 10))}
        </div>
      )}
    </section>
  );
}
