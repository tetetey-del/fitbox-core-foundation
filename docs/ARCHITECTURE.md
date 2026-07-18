# Arquitectura y decisiones de diseño

Este documento explica **por qué** el código está estructurado así. El **qué**
está en el `README.md`.

---

## 1. Patrón Repository sobre `localStorage`

**Problema:** `localStorage` es un `Map<string, string>` global. Sin abstracción,
la lógica de negocio termina llena de `JSON.parse(localStorage.getItem(...))`,
imposible de tipar, testear o migrar.

**Solución:** una capa `BaseRepo<T>` en `src/lib/storage/repositories/base.repo.ts`
que:

- Serializa/deserializa transparentemente.
- Genera IDs y timestamps (`newId`, `nowIso`).
- Aplica scoping por tenant vía `buildKey(tenantId, collection)`.
- Expone la misma API que usaríamos con Supabase: `list / getById / query /
  create / update / remove / replaceAll`.

**Consecuencia:** migrar a un backend real implica reescribir **solo** los
repos. Los servicios y componentes no cambian de forma.

## 2. Servicios: única fuente de lógica de negocio

Los componentes son intencionadamente "tontos": renderizan y disparan
callbacks. Toda regla — ventana de cancelación, promoción de lista de espera,
consumo/devolución de créditos, dedupe de notificaciones — vive en
`src/lib/services/*.service.ts`.

Beneficios concretos:

- El botón "Cancelar reserva" en el listado del socio y en el sheet de
  detalle del staff comparten el mismo `cancelBooking(bookingId, role)`, así
  que la ventana de 2 h se aplica siempre y la devolución de crédito nunca se
  olvida.
- Cambiar la ventana de cancelación por tenant es **una sola línea** en
  `getCancellationWindow`.

## 3. Estructura de carpetas

```
src/
├── config/company.ts             ← datos de la empresa y créditos (único lugar)
├── contexts/AuthContext.tsx      ← sesión + role helpers
├── hooks/                        ← useRole, useModules, useRequireModule, ...
├── lib/
│   ├── constants.ts              ← TTLs, límites, ventanas por defecto
│   ├── date.ts                   ← utilidades LOCAL-time (nunca toISOString)
│   ├── format.ts                 ← formato de dinero, tiempo, números
│   ├── crypto.ts                 ← SHA-256 + OTP + códigos de invitación
│   ├── image.ts                  ← compresión canvas antes de base64
│   ├── themes.ts                 ← 5 temas via CSS vars
│   ├── data-bus.ts               ← CustomEvent para refrescar UI
│   ├── seed.ts                   ← seed idempotente
│   ├── services/*.service.ts     ← lógica de negocio
│   └── storage/
│       ├── db.ts                 ← get/set/remove + buildKey
│       ├── session.ts            ← sessionStore
│       ├── superadmins.ts        ← super sesión aparte
│       └── repositories/*.repo.ts
├── components/
│   ├── landing/                  ← secciones de la landing pública
│   ├── layout/                   ← AppLayout, Sidebar, Header, MobileNav
│   ├── auth/, booking/, classes/, feed/, members/, prs/, wods/,
│   ├── config/, dashboard/, health/, legal/, notifications/, onboarding/
│   ├── theme/, socios/
│   └── ui/                       ← shadcn/ui puros
├── routes/                       ← file-based routing
└── types/index.ts                ← entidades del dominio
```

## 4. Dedupe de notificaciones con `dedupeKey`

**Problema:** una sesión cancelada con 15 personas apuntadas + 5 en waitlist
notifica 20 veces. Si el admin la re-cancela por error, 40. El usuario ve
spam en la campana.

**Solución:** `notify()` acepta un `dedupeKey` opcional. Antes de crear la
notificación, se consulta si ya existe otra con esa clave para ese usuario;
si existe, se descarta silenciosamente. Ejemplo:
`dedupeKey: cancelled:${sessionId}:${userId}`.

Para las promociones de waitlist NO usamos dedupe: cada promoción es un
evento distinto y merece su notificación.

## 5. Remapeo de IDs en import de backups

Un backup contiene `id`s como `usr_abc123`. Si al importar los volcáramos
tal cual y ya existiera un usuario con ese id, se pisarían datos.

**Solución:** el import genera un **nuevo tenant** y construye un `Map<oldId,
newId>` por entidad. Se recorre en orden topológico (users → templates →
sessions → bookings → checkins ...) reasignando FKs con el mapa. Si un FK no
resuelve, se deja tal cual y se logea.

Esto permite importar el mismo backup varias veces sin colisión: cada import
crea un tenant `<nombre> (importado)` con sufijo timestamp en el slug.

## 6. Namespacing por tenant

`buildKey(tenantId, collection)` produce claves como
`fitbox:t_XyZ:bookings`. Para "borrar un tenant" basta con iterar
`localStorage` y eliminar todas las claves que empiezan por el prefijo — sin
tener que cargar cada colección en memoria.

## 7. Sesión y super-sesión separadas

`sessionStore` y `superSessionStore` son dos claves distintas. Impersonar
desde super admin escribe en `sessionStore` **manteniendo** la super sesión,
así el banner de "estás impersonando" puede ofrecer "Volver al panel super"
en un click sin re-autenticar.

## 8. Fechas siempre en horario local

`toISOString()` devuelve UTC. Si un socio en Madrid reserva la clase del
`2025-07-14 07:00`, `new Date(...).toISOString().slice(0,10)` puede devolver
`2025-07-13` en verano. Todas las claves de fecha (`YYYY-MM-DD`) se
construyen con `getFullYear/getMonth/getDate` locales (`toDateKey` en
`src/lib/date.ts`). **Nunca** usar `toISOString` para claves de día.

## 9. Mutex de reserva

Doble-click en "Reservar" puede llegar a `bookSession` dos veces antes de
que la primera escriba. Como todo el storage es síncrono, un `Set<string>`
en memoria como candado por `(sessionId, userId)` es suficiente: la primera
llamada entra, la segunda ve el candado y devuelve `{ ok: false, reason:
"Reserva en curso" }`.

## 10. Compresión de imágenes

Las imágenes se guardan como data-URLs base64 dentro de `localStorage`
(quota ~5 MB por origen). El helper `compressImage()` en `src/lib/image.ts`
redibuja en un `<canvas>` con lado máximo `IMAGE_MAX_DIMENSION` y exporta a
JPEG con `IMAGE_JPEG_QUALITY`. Después, `dataUrlBytes()` verifica que no
supere el límite del contexto (`MAX_LOGO_BYTES` para logos,
`MAX_POST_IMAGE_BYTES` para posts).

## 11. Data bus

Las mutaciones se propagan con `notifyDataChanged()` que dispara un
`CustomEvent`. Las páginas suscritas se refrescan. Es un sustituto local de
Realtime: cuando se migre a Supabase se reemplaza por
`supabase.channel(...).on('postgres_changes', ...)` sin tocar los servicios.

## 12. Módulos activables (Fase 11)

Cuatro módulos de fidelización siguen el patrón estándar (tipos → repos
scoped → servicios → rutas):

- **Retos** (`challenges`) — asistencia y benchmarks con ranking e
  insignias. Progreso automático leyendo `check-ins` o `personal_records`.
- **Rutinas** (`programs`) — programas semanales asignables a socios.
- **Tienda** (`shop`) — pedido con recogida en el box y control de stock.
- **Salud** (`health`) — peso/% graso/FC + gráficas Recharts (lazy).

Backup subido a `BACKUP_SCHEMA_VERSION = 2` con las 9 colecciones nuevas;
se mantiene compatibilidad de import con v1.

---

## Guía de migración a Supabase

Cuando se quiera pasar de demo a producción real:

1. Habilitar Lovable Cloud o un proyecto de Supabase. Crear tablas con
   columna `tenant_id UUID NOT NULL`.
2. Row Level Security en todas las tablas:
   ```sql
   ALTER TABLE public.<t> ENABLE ROW LEVEL SECURITY;
   CREATE POLICY tenant_isolation ON public.<t>
     FOR ALL TO authenticated
     USING (tenant_id = (SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()));
   ```
   Roles en tabla aparte `user_roles(user_id, tenant_id, role app_role)`
   con función `has_role()` `SECURITY DEFINER`.
3. Reemplazar `auth.service.ts` por `supabase.auth.signUp` /
   `signInWithPassword` / `resetPasswordForEmail`. El hashing SHA-256
   desaparece.
4. Cada `*.repo.ts` se reescribe como wrapper de
   `supabase.from('<tabla>').select/insert/update/delete`. La firma pública
   se mantiene → **los servicios no cambian**.
5. `sessionStore` pasa a leer `supabase.auth.getSession()`. El `tenantId`
   sale del claim custom `user_metadata.tenant_id`.
6. Realtime (opcional): sustituir `data-bus` por
   `supabase.channel().on('postgres_changes')` para invalidar queries.
7. Base64 de logos/posts → `supabase.storage.from('media')`.
8. Backup/Import: Edge Functions que copian filas entre tenants con
   `SECURITY DEFINER`.
