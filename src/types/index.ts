export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/** Rol dentro de un tenant. El super_admin es GLOBAL y no vive aquí. */
export type UserRole = "admin" | "coach" | "member";

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin",
  coach: "Coach",
  member: "Socio",
};

export type ThemeId =
  | "dark-carbon"
  | "light-clean"
  | "neon"
  | "warm-earth"
  | "corporate-blue";

export interface TenantModules {
  reservas: boolean;
  socios: boolean;
  prs: boolean;
  feed: boolean;
  pagos: boolean;
  challenges: boolean;
  programs: boolean;
  shop: boolean;
  health: boolean;
}

export const DEFAULT_MODULES: TenantModules = {
  reservas: true,
  socios: true,
  prs: true,
  feed: true,
  pagos: true,
  challenges: true,
  programs: true,
  shop: true,
  health: true,
};

export interface TenantSettings {
  cancellationWindowHours: number;
  enabledModules?: TenantModules;
}

export type TenantStatus = "active" | "suspended";

export interface Tenant extends BaseEntity {
  name: string;
  slug: string;
  logo?: string;
  brandColor: string;
  themeId?: ThemeId;
  status?: TenantStatus;
  settings?: TenantSettings;
}

export type UserStatus = "active" | "invited" | "pending" | "suspended";

export type MemberGoal = "fuerza" | "perder_peso" | "resistencia" | "general";

export const MEMBER_GOAL_LABEL: Record<MemberGoal, string> = {
  fuerza: "Ganar fuerza",
  perder_peso: "Perder peso",
  resistencia: "Mejorar resistencia",
  general: "Salud general",
};

export interface UserProfile {
  goal?: MemberGoal;
  bio?: string;
  /** Si el socio permite al staff ver sus métricas de salud. Default false. */
  showHealthToCoach?: boolean;
}

export interface User extends BaseEntity {
  tenantId: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  passwordHash?: string;
  status?: UserStatus;
  profile?: UserProfile;
}

export type InvitationStatus = "pending" | "accepted" | "revoked" | "expired";

export interface Invitation extends BaseEntity {
  tenantId: string;
  code: string;
  email?: string;
  role: "coach" | "member";
  planId?: string;
  invitedBy: string;
  status: InvitationStatus;
  expiresAt: string;
  acceptedByUserId?: string;
}

export interface PasswordResetCode extends BaseEntity {
  userId: string;
  code: string;
  expiresAt: string;
  used: boolean;
}

/** Super admin GLOBAL del SaaS. No pertenece a ningún tenant. */
export interface SuperAdmin {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  passwordHash?: string;
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
  /** Presente si un super admin está impersonando este tenant. */
  impersonatedBy?: string; // superAdminId
}

/** Sesión activa del super admin (guardada global, aparte). */
export interface SuperSession {
  superAdminId: string;
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
  date: string;
  startTime: string;
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
  startDate: string;
  endDate: string;
  status: MembershipStatus;
  creditsRemaining?: number;
}

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
  date: string;
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
  value: number;
  rx: boolean;
  date: string;
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

// ---- Feed ----

export type PostType = "aviso" | "consejo" | "receta" | "wod";

export interface Post extends BaseEntity {
  tenantId: string;
  authorId: string;
  type: PostType;
  title: string;
  content: string;
  imageUrl?: string;
  pinned: boolean;
}

export const POST_TYPE_LABEL: Record<PostType, string> = {
  aviso: "Aviso",
  consejo: "Consejo",
  receta: "Receta",
  wod: "WOD",
};

// ---- WODs ----

export type WodBlockType = "calentamiento" | "fuerza" | "metcon" | "accesorio";

export interface WodBlock {
  type: WodBlockType;
  content: string;
}

export interface Wod extends BaseEntity {
  tenantId: string;
  date: string; // YYYY-MM-DD
  title: string;
  blocks: WodBlock[];
  publishedBy?: string;
  published: boolean;
}

export const WOD_BLOCK_LABEL: Record<WodBlockType, string> = {
  calentamiento: "Calentamiento",
  fuerza: "Fuerza",
  metcon: "MetCon",
  accesorio: "Accesorio",
};

// ---- Notificaciones ----

export type NotificationType =
  | "waitlist_promoted"
  | "membership_expiring"
  | "session_cancelled"
  | "new_post"
  | "challenge_completed"
  | "program_assigned"
  | "order_ready";

export interface Notification extends BaseEntity {
  tenantId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  linkTo?: string;
  /** Clave estable para evitar duplicados (ej: `expiring:<membershipId>`). */
  dedupeKey?: string;
}

// ---- Retos ----

export type ChallengeType = "attendance" | "benchmark";
export type ChallengeStatus = "draft" | "active" | "finished";

export interface Challenge extends BaseEntity {
  tenantId: string;
  title: string;
  description: string;
  type: ChallengeType;
  /** attendance → nº de check-ins objetivo; benchmark → exerciseId */
  goal: number | string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  status: ChallengeStatus;
  badge: string; // emoji o nombre lucide
}

export interface ChallengeParticipant extends BaseEntity {
  tenantId: string;
  challengeId: string;
  userId: string;
  progress: number;
  completedAt?: string;
}

// ---- Rutinas / Programas ----

export type ProgramLevel = "iniciacion" | "intermedio" | "avanzado";
export const PROGRAM_LEVEL_LABEL: Record<ProgramLevel, string> = {
  iniciacion: "Iniciación",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

export interface Program extends BaseEntity {
  tenantId: string;
  title: string;
  description: string;
  weeks: number;
  level: ProgramLevel;
  createdBy: string;
}

export interface ProgramSession extends BaseEntity {
  tenantId: string;
  programId: string;
  weekNumber: number;
  dayNumber: number; // 1..7
  title: string;
  blocks: WodBlock[];
}

export type AssignmentStatus = "active" | "completed" | "abandoned";

export interface ProgramAssignment extends BaseEntity {
  tenantId: string;
  programId: string;
  userId: string;
  assignedBy: string;
  startDate: string; // YYYY-MM-DD
  status: AssignmentStatus;
}

export interface ProgramProgress extends BaseEntity {
  tenantId: string;
  assignmentId: string;
  programSessionId: string;
  completedAt: string;
  notes?: string;
}

// ---- Tienda ----

export type ProductCategory = "ropa" | "suplementacion" | "accesorios" | "otro";
export const PRODUCT_CATEGORY_LABEL: Record<ProductCategory, string> = {
  ropa: "Ropa",
  suplementacion: "Suplementación",
  accesorios: "Accesorios",
  otro: "Otro",
};

export interface Product extends BaseEntity {
  tenantId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: ProductCategory;
  /** null = ilimitado */
  stock: number | null;
  active: boolean;
}

export interface OrderItem {
  productId: string;
  qty: number;
  priceAtOrder: number;
  name: string;
}

export type OrderStatus = "pendiente" | "listo" | "entregado" | "cancelado";
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pendiente: "Pendiente",
  listo: "Listo para recoger",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export interface Order extends BaseEntity {
  tenantId: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  pickupNotes?: string;
  paidAt?: string;
}

// ---- Salud / Progreso ----

export interface BodyMeasurements {
  chest?: number;
  waist?: number;
  hip?: number;
  arm?: number;
  thigh?: number;
}

export interface BodyMetric extends BaseEntity {
  tenantId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  weightKg?: number;
  bodyFatPct?: number;
  restingHr?: number;
  measurements?: BodyMeasurements;
  notes?: string;
}
