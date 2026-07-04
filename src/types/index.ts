export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = "admin" | "coach" | "member";

export interface TenantSettings {
  cancellationWindowHours: number;
}

export interface Tenant extends BaseEntity {
  name: string;
  slug: string;
  logo?: string;
  brandColor: string;
  settings?: TenantSettings;
}

export interface User extends BaseEntity {
  tenantId: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Member extends BaseEntity {
  tenantId: string;
  userId: string;
  membershipType?: string;
  active: boolean;
  joinedAt: string;
}

export interface Session {
  tenantId: string;
  userId: string;
  role: UserRole;
}

// ---- Clases y reservas ----

export type ClassType =
  | "wod"
  | "halterofilia"
  | "gimnasticos"
  | "movilidad"
  | "open_box"
  | "otro";

export interface ClassTemplate extends BaseEntity {
  tenantId: string;
  name: string;
  type: ClassType;
  durationMinutes: number;
  defaultCapacity: number;
  defaultCoachId?: string;
  color?: string;
}

export type ClassSessionStatus = "scheduled" | "cancelled";

export interface ClassSession extends BaseEntity {
  tenantId: string;
  templateId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  durationMinutes: number;
  capacity: number;
  coachId?: string;
  status: ClassSessionStatus;
}

export type BookingStatus = "confirmed" | "waitlist" | "cancelled";

export interface Booking extends BaseEntity {
  tenantId: string;
  sessionId: string;
  userId: string;
  status: BookingStatus;
  position?: number;
}

export interface CheckIn extends BaseEntity {
  tenantId: string;
  bookingId: string;
  sessionId: string;
  userId: string;
  checkedInAt: string;
}

export const CLASS_TYPE_LABEL: Record<ClassType, string> = {
  wod: "WOD",
  halterofilia: "Halterofilia",
  gimnasticos: "Gimnásticos",
  movilidad: "Movilidad",
  open_box: "Open Box",
  otro: "Otro",
};

// ---- Membresías y pagos ----

export type PlanType = "unlimited" | "credits";

export interface MembershipPlan extends BaseEntity {
  tenantId: string;
  name: string;
  priceMonthly: number;
  type: PlanType;
  creditsPerMonth?: number;
  active: boolean;
}

export type MembershipStatus = "active" | "expired" | "cancelled";

export interface Membership extends BaseEntity {
  tenantId: string;
  userId: string;
  planId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: MembershipStatus;
  creditsRemaining?: number;
}

/** Estado derivado que se muestra en la UI. */
export type MembershipUiStatus =
  | "active"
  | "expiring_soon"
  | "expired"
  | "none";

export type PaymentMethod = "efectivo" | "tarjeta" | "domiciliacion" | "otro";

export interface Payment extends BaseEntity {
  tenantId: string;
  userId: string;
  membershipId?: string;
  amount: number;
  date: string; // YYYY-MM-DD
  method: PaymentMethod;
  notes?: string;
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  domiciliacion: "Domiciliación",
  otro: "Otro",
};

export const MEMBERSHIP_UI_LABEL: Record<MembershipUiStatus, string> = {
  active: "Activo",
  expiring_soon: "Expira pronto",
  expired: "Expirado",
  none: "Sin plan",
};

// ---- PRs / Benchmarks ----

export type ExerciseCategory =
  | "fuerza"
  | "olimpico"
  | "benchmark_wod"
  | "gimnastico"
  | "cardio";

export type ExerciseUnit = "kg" | "tiempo" | "reps" | "metros";

export interface Exercise extends BaseEntity {
  tenantId: string;
  name: string;
  category: ExerciseCategory;
  unit: ExerciseUnit;
  isCustom: boolean;
}

export interface PersonalRecord extends BaseEntity {
  tenantId: string;
  userId: string;
  exerciseId: string;
  /** kg / reps / metros: valor directo. tiempo: segundos. */
  value: number;
  rx: boolean;
  date: string; // YYYY-MM-DD
  notes?: string;
}

export const EXERCISE_CATEGORY_LABEL: Record<ExerciseCategory, string> = {
  fuerza: "Fuerza",
  olimpico: "Olímpicos",
  benchmark_wod: "Benchmark WODs",
  gimnastico: "Gimnásticos",
  cardio: "Cardio",
};

export const EXERCISE_UNIT_LABEL: Record<ExerciseUnit, string> = {
  kg: "kg",
  tiempo: "tiempo",
  reps: "reps",
  metros: "m",
};


