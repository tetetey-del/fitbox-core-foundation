import { attendanceOf, favoriteClass, monthlyAttendance, totalAttendance } from "./attendance.helpers";
import { formatDate } from "@/lib/date";

/** Bloque "Actividad": KPIs de asistencia y últimos check-ins. */
export function MemberAttendanceTab({ userId }: { userId: string }) {
  const history = attendanceOf(userId);
  const monthly = monthlyAttendance(userId);
  const favorite = favoriteClass(userId);
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">Actividad</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-border bg-card p-3">
          <div className="text-xs text-muted-foreground">Clases hechas</div>
          <div className="text-2xl font-semibold mt-1" style={{ color: "var(--brand)" }}>{totalAttendance(userId)}</div>
        </div>
        <div className="rounded-md border border-border bg-card p-3">
          <div className="text-xs text-muted-foreground">Este mes</div>
          <div className="text-2xl font-semibold mt-1">{monthly}</div>
        </div>
        <div className="col-span-2 rounded-md border border-border bg-card p-3 sm:col-span-1">
          <div className="text-xs text-muted-foreground">Clase favorita</div>
          <div className="text-lg font-medium mt-1 truncate">{favorite ?? "—"}</div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Se cuenta cada clase en la que el coach le marcó el check-in.</p>
      {history.length > 0 && (
        <ul className="space-y-1">
          {history.slice(0, 6).map((h) => (
            <li
              key={h.id}
              className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              <span>{h.className}</span>
              <span className="text-xs text-muted-foreground">
                {formatDate(h.date)} · {h.time}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
