/**
 * @file Servicio de tienda del box (pedido y recogida presencial).
 * Sin pasarela: sólo estado del pedido y contabilidad interna de stock.
 * Notifica al socio cuando su pedido queda "listo".
 */
import type { Order, OrderItem, OrderStatus, Product } from "@/types";
import { productsRepo } from "@/lib/storage/repositories/products.repo";
import { ordersRepo } from "@/lib/storage/repositories/orders.repo";
import { notify } from "./notifications.service";

export class ShopError extends Error {}

export function createProduct(input: Omit<Product, keyof import("@/types").BaseEntity>): Product {
  return productsRepo.create(input);
}
export function updateProduct(id: string, patch: Partial<Product>) {
  return productsRepo.update(id, patch);
}
export function deleteProduct(id: string): void {
  productsRepo.remove(id);
}
export function listActiveProducts(): Product[] {
  return productsRepo
    .query((p) => p.active)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export interface CartItem {
  productId: string;
  qty: number;
}

export function createOrder(input: {
  tenantId: string;
  userId: string;
  items: CartItem[];
  pickupNotes?: string;
}): Order {
  if (input.items.length === 0) throw new ShopError("El carrito está vacío");
  const items: OrderItem[] = [];
  let total = 0;
  for (const it of input.items) {
    const p = productsRepo.getById(it.productId);
    if (!p || !p.active) throw new ShopError(`Producto no disponible`);
    if (p.stock !== null && p.stock < it.qty) {
      throw new ShopError(`Sin stock suficiente de ${p.name}`);
    }
    items.push({ productId: p.id, qty: it.qty, priceAtOrder: p.price, name: p.name });
    total += p.price * it.qty;
    if (p.stock !== null) productsRepo.update(p.id, { stock: p.stock - it.qty });
  }
  return ordersRepo.create({
    tenantId: input.tenantId,
    userId: input.userId,
    items,
    total,
    status: "pendiente",
    pickupNotes: input.pickupNotes,
  });
}

export function setOrderStatus(orderId: string, status: OrderStatus): Order | null {
  const order = ordersRepo.getById(orderId);
  if (!order) return null;
  if (status === "cancelado" && order.status !== "cancelado") {
    // reponer stock
    for (const it of order.items) {
      const p = productsRepo.getById(it.productId);
      if (p && p.stock !== null) productsRepo.update(p.id, { stock: p.stock + it.qty });
    }
  }
  const updated = ordersRepo.update(orderId, { status });
  if (status === "listo" && order.status !== "listo") {
    notify({
      tenantId: order.tenantId,
      userId: order.userId,
      type: "order_ready",
      title: "Tu pedido está listo",
      body: `Pasa por el box a recoger tu pedido (${order.items.length} artículos).`,
      linkTo: "/tienda",
      dedupeKey: `order_ready:${orderId}`,
    });
  }
  return updated;
}

export function markOrderPaid(orderId: string): Order | null {
  return ordersRepo.update(orderId, { paidAt: new Date().toISOString() });
}

export function listMyOrders(userId: string): Order[] {
  return ordersRepo
    .query({ userId })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listAllOrders(): Order[] {
  return ordersRepo
    .list()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function pendingOrdersCount(): number {
  return ordersRepo.query({ status: "pendiente" }).length;
}
