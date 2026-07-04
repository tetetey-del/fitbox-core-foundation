export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = "owner" | "coach" | "member";

export interface Tenant extends BaseEntity {
  name: string;
  slug: string;
  logo?: string;
  brandColor: string;
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
