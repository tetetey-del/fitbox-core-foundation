import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useDataVersion, notifyDataChanged } from "@/lib/data-bus";
import { useRequireModule } from "@/hooks/useRequireModule";
import { useModules } from "@/hooks/useModules";
import {
  createOrder,
  createProduct,
  deleteProduct,
  listActiveProducts,
  listAllOrders,
  listMyOrders,
  markOrderPaid,
  setOrderStatus,
  updateProduct,
} from "@/lib/services/shop.service";
import { productsRepo } from "@/lib/storage/repositories/products.repo";
import type { Order, OrderStatus, Product, ProductCategory } from "@/types";
import { ORDER_STATUS_LABEL, PRODUCT_CATEGORY_LABEL } from "@/types";
import { compressImage, dataUrlBytes } from "@/lib/image";
import { formatDate } from "@/lib/date";
import { currencySymbol, formatMoney } from "@/lib/format";

export const Route = createFileRoute("/tienda")({
  head: () => ({ meta: [{ title: "Tienda — Kinflow" }] }),
  component: TiendaPage,
});

function TiendaPage() {
  const enabled = useRequireModule("shop");
  const { currentUser } = useAuth();
  useDataVersion();
  if (!enabled || !currentUser) return null;
  const isStaff = currentUser.role === "admin" || currentUser.role === "coach";
  return (
    <AppLayout>
      <PageHeader title="Tienda" description="Pide y recoge en el box." />
      {isStaff ? <StaffShop /> : <MemberShop userId={currentUser.id} />}
    </AppLayout>
  );
}

function MemberShop({ userId }: { userId: string }) {
  const products = listActiveProducts();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const { currentTenant } = useAuth();

  const cartItems = useMemo(() =>
    Object.entries(cart)
      .map(([productId, qty]) => ({ product: productsRepo.getById(productId)!, qty }))
      .filter((x) => x.product),
    [cart],
  );
  const total = cartItems.reduce((acc, x) => acc + x.product.price * x.qty, 0);
  const orders = listMyOrders(userId);

  const submit = () => {
    if (!currentTenant) return;
    try {
      createOrder({
        tenantId: currentTenant.id,
        userId,
        items: Object.entries(cart).map(([productId, qty]) => ({ productId, qty })),
        pickupNotes: notes || undefined,
      });
      toast.success("Pedido creado");
      setCart({});
      setNotes("");
      setConfirmOpen(false);
      notifyDataChanged();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Tabs defaultValue="catalog">
      <TabsList className="mb-4">
        <TabsTrigger value="catalog">Catálogo</TabsTrigger>
        <TabsTrigger value="mine">Mis pedidos ({orders.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="catalog">
        {products.length === 0 ? (
          <EmptyState text="No hay productos disponibles." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                qty={cart[p.id] ?? 0}
                onAdd={() => setCart({ ...cart, [p.id]: (cart[p.id] ?? 0) + 1 })}
                onRemove={() => {
                  const next = { ...cart };
                  const q = (next[p.id] ?? 0) - 1;
                  if (q <= 0) delete next[p.id];
                  else next[p.id] = q;
                  setCart(next);
                }}
              />
            ))}
          </div>
        )}
        {cartItems.length > 0 && (
          <div className="fixed bottom-20 md:bottom-6 right-4 md:right-8 z-40 w-80 rounded-lg border border-border bg-card shadow-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Carrito</span>
              <Button variant="ghost" size="icon" onClick={() => setCart({})}>
                <X className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            </div>
            <ul className="text-sm max-h-40 overflow-y-auto divide-y divide-border">
              {cartItems.map(({ product, qty }) => (
                <li key={product.id} className="py-1 flex justify-between">
                  <span>{qty} × {product.name}</span>
                  <span>{formatMoney(product.price * qty)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between font-medium">
              <span>Total</span><span>{formatMoney(total)}</span>
            </div>
            <Button className="w-full" onClick={() => setConfirmOpen(true)}>Confirmar pedido</Button>
          </div>
        )}
      </TabsContent>
      <TabsContent value="mine">
        {orders.length === 0 ? (
          <EmptyState text="Aún no tienes pedidos." />
        ) : (
          <div className="grid gap-3 max-w-2xl">
            {orders.map((o) => <MemberOrderCard key={o.id} order={o} />)}
          </div>
        )}
      </TabsContent>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar pedido</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Pasa a recogerlo por el box. Total: <span className="font-medium text-foreground">{formatMoney(total)}</span>.
          </p>
          <div>
            <Label>Notas (opcional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button onClick={submit}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}

function ProductCard({
  product,
  qty,
  onAdd,
  onRemove,
}: {
  product: Product;
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const soldOut = product.stock !== null && product.stock <= 0;
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {product.imageUrl ? (
        <img src={product.imageUrl} alt={product.name} className="w-full aspect-square object-cover" />
      ) : (
        <div className="w-full aspect-square bg-muted flex items-center justify-center text-muted-foreground">
          <ShoppingBag className="h-8 w-8" strokeWidth={1.5} />
        </div>
      )}
      <div className="p-4 space-y-2">
        <div>
          <h3 className="font-medium">{product.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold">{formatMoney(product.price)}</span>
          <span className="text-xs text-muted-foreground">
            {product.stock === null ? "En stock" : product.stock > 0 ? `Stock: ${product.stock}` : "Agotado"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {qty > 0 && (
            <Button variant="outline" size="sm" onClick={onRemove}>-</Button>
          )}
          {qty > 0 && <span className="text-sm w-6 text-center">{qty}</span>}
          <Button size="sm" onClick={onAdd} disabled={soldOut} className="flex-1">
            {qty > 0 ? "+" : "Añadir al carrito"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MemberOrderCard({ order }: { order: Order }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex justify-between text-sm">
        <span className="font-medium">Pedido {order.id.slice(0, 6)}</span>
        <span className="text-xs px-2 py-0.5 rounded-md bg-muted">{ORDER_STATUS_LABEL[order.status]}</span>
      </div>
      <ul className="text-sm text-muted-foreground mt-2">
        {order.items.map((it, i) => (
          <li key={i}>{it.qty} × {it.name}</li>
        ))}
      </ul>
      <div className="flex justify-between text-sm mt-2">
        <span>{formatDate(order.createdAt.slice(0, 10))}</span>
        <span className="font-medium">{formatMoney(order.total)}</span>
      </div>
    </div>
  );
}

// ---- Staff ----

function StaffShop() {
  return (
    <Tabs defaultValue="orders">
      <TabsList className="mb-4">
        <TabsTrigger value="orders">Pedidos</TabsTrigger>
        <TabsTrigger value="products">Productos</TabsTrigger>
      </TabsList>
      <TabsContent value="orders">
        <StaffOrdersBoard />
      </TabsContent>
      <TabsContent value="products">
        <StaffProductsPanel />
      </TabsContent>
    </Tabs>
  );
}

function StaffOrdersBoard() {
  const { tenantUsers } = useAuth();
  const modules = useModules();
  const orders = listAllOrders();
  const cols: OrderStatus[] = ["pendiente", "listo", "entregado", "cancelado"];
  const userById = new Map(tenantUsers.map((u) => [u.id, u]));
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cols.map((s) => (
        <div key={s} className="rounded-lg border border-border bg-card p-3 space-y-2">
          <h3 className="text-sm font-medium">{ORDER_STATUS_LABEL[s]}</h3>
          {orders.filter((o) => o.status === s).length === 0 && (
            <p className="text-xs text-muted-foreground">Vacío</p>
          )}
          {orders
            .filter((o) => o.status === s)
            .map((o) => (
              <StaffOrderCard
                key={o.id}
                order={o}
                userName={userById.get(o.userId)?.name ?? "?"}
                showPaid={modules.pagos}
              />
            ))}
        </div>
      ))}
    </div>
  );
}

function StaffOrderCard({
  order,
  userName,
  showPaid,
}: {
  order: Order;
  userName: string;
  showPaid: boolean;
}) {
  return (
    <div className="rounded-md border border-border p-3 text-sm space-y-2">
      <div className="flex justify-between">
        <span className="font-medium">{userName}</span>
        <span className="text-xs text-muted-foreground">{formatDate(order.createdAt.slice(0, 10))}</span>
      </div>
      <ul className="text-xs text-muted-foreground">
        {order.items.map((it, i) => <li key={i}>{it.qty}× {it.name}</li>)}
      </ul>
      <div className="flex justify-between">
        <span>{formatMoney(order.total)}</span>
        {showPaid && (
          <span className={order.paidAt ? "text-emerald-600 text-xs" : "text-xs text-muted-foreground"}>
            {order.paidAt ? "Pagado" : "No pagado"}
          </span>
        )}
      </div>
      {order.pickupNotes && <p className="text-xs italic">"{order.pickupNotes}"</p>}
      <div className="flex flex-wrap gap-1">
        {order.status === "pendiente" && (
          <Button size="sm" variant="outline" onClick={() => { setOrderStatus(order.id, "listo"); notifyDataChanged(); }}>
            Listo
          </Button>
        )}
        {order.status === "listo" && (
          <Button size="sm" variant="outline" onClick={() => { setOrderStatus(order.id, "entregado"); notifyDataChanged(); }}>
            Entregado
          </Button>
        )}
        {(order.status === "pendiente" || order.status === "listo") && (
          <Button size="sm" variant="ghost" onClick={() => { setOrderStatus(order.id, "cancelado"); notifyDataChanged(); }}>
            Cancelar
          </Button>
        )}
        {showPaid && !order.paidAt && order.status !== "cancelado" && (
          <Button size="sm" variant="ghost" onClick={() => { markOrderPaid(order.id); notifyDataChanged(); }}>
            Marcar pagado
          </Button>
        )}
      </div>
    </div>
  );
}

function StaffProductsPanel() {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const products = productsRepo.list().sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-2" strokeWidth={1.5} /> Nuevo producto
        </Button>
      </div>
      {products.length === 0 ? (
        <EmptyState text="Aún no hay productos. Añade el primero." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {products.map((p) => (
            <div key={p.id} className="rounded-lg border border-border bg-card p-3 flex gap-3">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt="" className="h-16 w-16 rounded object-cover" />
              ) : (
                <div className="h-16 w-16 rounded bg-muted flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                  <span className="font-medium truncate">{p.name}</span>
                  <span className="text-sm">{formatMoney(p.price)}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {PRODUCT_CATEGORY_LABEL[p.category]} · {p.stock === null ? "∞" : `${p.stock} uds`} · {p.active ? "Activo" : "Oculto"}
                </p>
                <div className="flex gap-1 mt-1">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(p)}>Editar</Button>
                  <Button size="sm" variant="ghost" onClick={() => { deleteProduct(p.id); toast.success("Eliminado"); notifyDataChanged(); }}>
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <ProductForm
        open={creating || !!editing}
        product={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
      />
    </div>
  );
}

function ProductForm({
  open,
  product,
  onClose,
}: {
  open: boolean;
  product: Product | null;
  onClose: () => void;
}) {
  const { currentTenant } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState<ProductCategory>("otro");
  const [stock, setStock] = useState<string>("");
  const [active, setActive] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | undefined>();

  useMemo(() => {
    if (product) {
      setName(product.name); setDescription(product.description); setPrice(product.price);
      setCategory(product.category); setStock(product.stock === null ? "" : String(product.stock));
      setActive(product.active); setImageUrl(product.imageUrl);
    } else {
      setName(""); setDescription(""); setPrice(0); setCategory("otro");
      setStock(""); setActive(true); setImageUrl(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, open]);

  const onFile = async (f: File) => {
    if (f.size > 5 * 1024 * 1024) return toast.error("Máx 5 MB");
    try {
      const compressed = await compressImage(f, { maxDimension: 800, quality: 0.8 });
      if (dataUrlBytes(compressed) > 500_000) toast.warning("Imagen algo grande");
      setImageUrl(compressed);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const save = () => {
    if (!currentTenant) return;
    if (!name.trim()) return toast.error("Falta nombre");
    const stockNum = stock.trim() === "" ? null : Number(stock);
    const data = {
      tenantId: currentTenant.id,
      name, description, price, category, stock: stockNum,
      active, imageUrl,
    };
    if (product) updateProduct(product.id, data);
    else createProduct(data);
    toast.success("Producto guardado");
    notifyDataChanged();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Editar producto" : "Nuevo producto"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Precio ({currencySymbol()})</Label>
              <Input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
            </div>
            <div>
              <Label>Categoría</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ProductCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRODUCT_CATEGORY_LABEL) as ProductCategory[]).map((k) => (
                    <SelectItem key={k} value={k}>{PRODUCT_CATEGORY_LABEL[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Stock (vacío = ilimitado)</Label>
              <Input type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} />
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={active ? "1" : "0"} onValueChange={(v) => setActive(v === "1")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Activo</SelectItem>
                  <SelectItem value="0">Oculto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Imagen</Label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
              className="block text-sm mt-1"
            />
            {imageUrl && (
              <div className="mt-2 flex items-center gap-2">
                <img src={imageUrl} alt="" className="h-16 w-16 rounded object-cover" />
                <Button variant="ghost" size="sm" onClick={() => setImageUrl(undefined)}>Quitar</Button>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
