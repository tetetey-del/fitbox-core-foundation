import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usersRepo } from "@/lib/storage/repositories/users.repo";
import { notifyDataChanged } from "@/lib/data-bus";
import { formatDate } from "@/lib/date";
import { ageFrom, formatBirthDate, todayKey } from "@/lib/memberData";
import type { User, UserProfile } from "@/types";

type Form = {
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  dni: string;
  address: string;
  emergencyName: string;
  emergencyPhone: string;
};

function toForm(user: User): Form {
  const p = user.profile ?? {};
  return {
    name: user.name,
    email: user.email,
    phone: p.phone ?? "",
    birthDate: p.birthDate ?? "",
    dni: p.dni ?? "",
    address: p.address ?? "",
    emergencyName: p.emergencyName ?? "",
    emergencyPhone: p.emergencyPhone ?? "",
  };
}

/** Bloque de datos personales editables del socio dentro del detalle. */
export function MemberProfileTab({ user }: { user: User }) {
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState<Form>(() => toForm(user));
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setF((prev) => ({ ...prev, [k]: e.target.value }));

  const saveEdit = () => {
    if (!f.name.trim() || !f.email.trim()) return toast.error("Nombre y email son obligatorios");
    const profile: UserProfile = {
      ...user.profile,
      phone: f.phone.trim() || undefined,
      birthDate: f.birthDate || undefined,
      dni: f.dni.trim() || undefined,
      address: f.address.trim() || undefined,
      emergencyName: f.emergencyName.trim() || undefined,
      emergencyPhone: f.emergencyPhone.trim() || undefined,
    };
    usersRepo.update(user.id, { name: f.name.trim(), email: f.email.trim(), profile });
    toast.success("Datos actualizados");
    notifyDataChanged();
    setEditing(false);
  };

  const p = user.profile ?? {};
  const age = ageFrom(p.birthDate);
  const emergency = [p.emergencyName, p.emergencyPhone].filter(Boolean).join(" · ");
  const rows: Array<[string, string]> = [
    ["Teléfono", p.phone ?? ""],
    ["Email", user.email],
    ["Nacimiento", p.birthDate ? `${formatBirthDate(p.birthDate)}${age !== null ? ` (${age} años)` : ""}` : ""],
    ["DNI", p.dni ?? ""],
    ["Dirección", p.address ?? ""],
    ["Emergencia", emergency],
    ["Alta", formatDate(user.createdAt.slice(0, 10))],
  ];

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Datos personales</h3>
        {!editing ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setF(toForm(user));
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
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nombre"><Input value={f.name} onChange={set("name")} /></Field>
          <Field label="Email"><Input type="email" value={f.email} onChange={set("email")} /></Field>
          <Field label="Teléfono"><Input type="tel" value={f.phone} onChange={set("phone")} /></Field>
          <Field label="Fecha de nacimiento"><Input type="date" max={todayKey()} value={f.birthDate} onChange={set("birthDate")} /></Field>
          <Field label="DNI / NIE"><Input value={f.dni} onChange={set("dni")} /></Field>
          <Field label="Dirección"><Input value={f.address} onChange={set("address")} /></Field>
          <Field label="Contacto de emergencia"><Input value={f.emergencyName} onChange={set("emergencyName")} placeholder="Nombre y relación" /></Field>
          <Field label="Teléfono de emergencia"><Input type="tel" value={f.emergencyPhone} onChange={set("emergencyPhone")} /></Field>
        </div>
      ) : (
        <dl className="grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex min-w-0 gap-2">
              <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
              <dd className={`min-w-0 break-words ${value ? "" : "text-muted-foreground/60"}`}>{value || "Sin completar"}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5 min-w-0">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
