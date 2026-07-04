export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = "owner" | "coach" | "member";

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
