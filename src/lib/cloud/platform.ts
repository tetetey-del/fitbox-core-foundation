/**
 * @file Panel de la plataforma (solo Celeste): ver todos los boxes reales y
 * cambiarles el plan. Todo lo controla Supabase (kf_platform_*).
 */
import { useEffect, useState } from "react";
import type { PlanId, SubscriptionStatus } from "@/types";
import { sb } from "./client";

export interface PlatformBox {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  country?: string | null;
  ownerEmail?: string | null;
  members: number;
  coaches: number;
  locations: number;
  plan: PlanId | null;
  status: SubscriptionStatus | null;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  notes: string | null;
  /** Lo que paga este box por mes, si no es el precio de lista (solo lo ve la plataforma). */
  priceOverride: number | null;
  discountPct: number | null;
  discountNote: string | null;
  blocked: boolean;
}

let cached: boolean | null = null;

export async function isPlatformAdmin(): Promise<boolean> {
  if (cached !== null) return cached;
  try {
    const { data: s } = await sb().auth.getSession();
    if (!s.session) return false;
    const { data, error } = await sb().rpc("kf_is_platform_admin");
    cached = !error && data === true;
  } catch {
    cached = false;
  }
  return cached;
}

/** true si la persona conectada es administradora de la plataforma. */
export function usePlatformAdmin(enabled: boolean): boolean {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    isPlatformAdmin().then((v) => alive && setOk(v));
    return () => {
      alive = false;
    };
  }, [enabled]);
  return ok;
}

export async function listPlatformBoxes(): Promise<PlatformBox[]> {
  const { data, error } = await sb().rpc("kf_platform_boxes");
  if (error) throw new Error(error.message.includes("KF_FORBIDDEN") ? "No tienes acceso al panel de la plataforma." : "No se pudo conectar.");
  return (data ?? []) as PlatformBox[];
}

export async function setBoxPlan(input: {
  tenantId: string;
  plan: PlanId;
  status: SubscriptionStatus;
  trialEndsAt: string | null;
  notes: string | null;
  priceOverride: number | null;
  discountPct: number | null;
  discountNote: string | null;
}): Promise<void> {
  const { error } = await sb().rpc("kf_platform_set_plan", {
    t: input.tenantId,
    p_plan: input.plan,
    p_status: input.status,
    p_trial_ends_at: input.trialEndsAt,
    p_notes: input.notes,
    p_price_override: input.priceOverride,
    p_discount_pct: input.discountPct,
    p_discount_note: input.discountNote,
  });
  if (error) throw new Error("No se pudo guardar.");
}

/** Lo que paga un box por mes: precio propio o el de lista, menos el descuento. */
export function monthlyCharge(listPrice: number, priceOverride: number | null, discountPct: number | null): number {
  const base = priceOverride ?? listPrice;
  const pct = Math.min(100, Math.max(0, discountPct ?? 0));
  return Math.round(base * (1 - pct / 100) * 100) / 100;
}
