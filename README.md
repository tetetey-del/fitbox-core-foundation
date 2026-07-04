# FitBox

**FitBox** es un SaaS multi-tenant para la gestión integral de boxes de CrossFit y estudios de entrenamiento funcional: reservas con lista de espera, membresías y créditos, registro de PRs con leaderboard, feed interno, WODs y panel de super-admin. La app funciona **100 % en el navegador** contra `localStorage`, pensada como MVP demostrable y como base para migrar a un backend real (ver *Guía de migración a Supabase* abajo).

---

## Stack

| Capa | Tecnología |
| --- | --- |
| Framework | **TanStack Start v1** (React 19 + Vite 7, SSR-ready) |
| Router | TanStack Router (file-based, `src/routes/`) |
| Estado servidor | TanStack Query |
| UI | Tailwind CSS v4 + shadcn/ui + Lucide (`strokeWidth={1.5}`) |
| Formularios | React Hook Form + Zod |
| Gráficas | Recharts |
| Animación | Framer Motion (sutil) |
| Persistencia | `localStorage` con capa de repositorios |
| Auth (demo) | SHA-256 en `Web Crypto API`, sesión en `localStorage` |
| Notificaciones | `sonner` (toasts) |

---

## Arquitectura por capas

```
                ┌──────────────────────────────┐
                │      Rutas / Páginas         │  src/routes/*.tsx
                │  (TanStack Router, file-b.)  │
                └─────────────┬────────────────┘
                              │ props / hooks
                ┌─────────────▼────────────────┐
                │   Componentes de dominio      │  src/components/{booking,members,prs,feed,...}
                │   (UI dumb + un poco de       │
                │    state local, sin lógica    │
                │    de negocio)                │
                └─────────────┬────────────────┘
                              │
                ┌─────────────▼────────────────┐
                │   Hooks / Contexts           │  src/hooks/*, src/contexts/AuthContext
                │  useAuth, useRole, useModules│
                └─────────────┬────────────────┘
                              │
                ┌─────────────▼────────────────┐
                │        SERVICIOS             │  src/lib/services/*.service.ts
                │  Lógica de negocio (booking, │
                │  membership, prs, backup...) │
                └─────────────┬────────────────┘
                              │
                ┌─────────────▼────────────────┐
                │      REPOSITORIES            │  src/lib/storage/repositories/*.repo.ts
                │  CRUD tipado + scoping por   │
                │  tenant. Nadie fuera de aquí │
                │  toca localStorage.          │
                └─────────────┬────────────────┘
                              │
                ┌─────────────▼────────────────┐
                │           db.ts              │  src/lib/storage/db.ts
                │  get/set/remove + buildKey() │
                │  namespacing por tenant      │
                └─────────────┬────────────────┘
                              │
                ┌─────────────▼────────────────┐
                │        localStorage          │  claves fitbox:*
                └──────────────────────────────┘
```

**Regla de oro:** los componentes hablan con **servicios**; los servicios hablan con **repositorios**; los repositorios son los únicos que tocan `db` (y por ende `localStorage`). Ningún componente debe llamar a `localStorage.*` ni a un repo directamente para lógica de negocio.

---

## Modelo de datos

Todas las entidades heredan de `BaseEntity { id, createdAt, updatedAt }`.

| Entidad | Relación clave |
| --- | --- |
| `Tenant` | 1 box. Contiene `settings` (ventana de cancelación, módulos activos), `themeId`, `brandColor`, `logo`. |
| `User` | Pertenece a un `Tenant`. Rol `admin` \| `coach` \| `member`. `passwordHash` SHA-256. |
| `SuperAdmin` | **Global**, fuera de cualquier tenant. Impersonation. |
| `ClassTemplate` | Plantilla recurrente (nombre, día, hora, coach por defecto). |
| `ClassSession` | Instancia real generada desde una plantilla (`date`, `startTime`, `capacity`, `status`). |
| `Booking` | `sessionId` × `userId` con estado `confirmed` / `waitlist` / `cancelled` y `position`. |
| `CheckIn` | Vinculado a un `Booking` confirmado. |
| `MembershipPlan` | `type: credits | unlimited`, `creditsPerMonth`, `price`. |
| `Membership` | Asignación plan ↔ socio, `startDate`, `endDate`, `creditsRemaining`. |
| `Payment` | Ligado a `membershipId`, con método (`cash | card | transfer`). |
| `Exercise` | Base compartida (`isCustom: false`) + custom del tenant. |
| `PersonalRecord` | `userId` × `exerciseId`, valor + fecha. |
| `Post` | Feed interno (owner/coach publican; todos leen). |
| `Wod` | Programación diaria; bloques `warmup/strength/metcon`. |
| `Notification` | Interna, `dedupeKey` evita duplicados. |
| `Invitation` | Código único de 8 chars, TTL 7 días, rol y plan preasignados. |
| `PasswordReset` | OTP de 6 dígitos, TTL 15 min, `used: boolean`. |

---

## Multitenancy y namespacing

Cada tenant tiene su propio **espacio de claves** en `localStorage`. Formato:

```
fitbox:<tenantId>:<collection>     → arrays de entidades scoped
fitbox:__global__:<collection>     → global (tenants, super admins, sesión)
fitbox:session                     → sesión del usuario logueado
fitbox:super_session               → sesión del super_admin
```

Los repos scoped resuelven `tenantId` desde `sessionStore` en tiempo real, salvo la variante `*repoFor(tenantId)` que fuerza uno explícito (usada en import/backup/impersonación).

---

## Roles y permisos

| Capacidad | `super_admin` | `admin` (dueño del box) | `coach` | `member` |
| --- | :---: | :---: | :---: | :---: |
| Panel `/admin` (todos los tenants) | ✅ | – | – | – |
| Impersonar cualquier tenant | ✅ | – | – | – |
| Suspender/activar tenant | ✅ | – | – | – |
| Configurar box (tema, módulos, ventana cancel.) | – | ✅ | – | – |
| Invitar coaches y socios | – | ✅ | – | – |
| Crear/editar `ClassTemplate` y `WOD` | – | ✅ | ✅ | – |
| Check-in y alta manual de asistentes | – | ✅ | ✅ | – |
| Publicar en el feed | – | ✅ | ✅ | – |
| Reservar / cancelar propia clase | – | ✅ | ✅ | ✅ |
| Registrar PRs propios | – | ✅ | ✅ | ✅ |

Enforcement: componente `<RoleGate>` + hook `useRole` + servicios que reciben `actorRole`.

---

## Módulos activables

Cada tenant tiene `settings.enabledModules`:

```ts
{
  reservas: true, socios: true, prs: true, feed: true, pagos: true,
  // Fase 11 — pack de fidelización
  challenges: true, programs: true, shop: true, health: true,
}
```

- **challenges** — Retos de asistencia y benchmarks con ranking e insignias (`/retos`).
- **programs** — Rutinas semanales asignables a socios (`/rutinas`).
- **shop** — Tienda con pedido y recogida en el box (`/tienda`).
- **health** — Registro manual de peso/% graso/FC y gráficas de evolución (pestaña Progreso en `/mi-cuenta`).

El hook `useModules()` lee esto y `useRequireModule(name)` redirige si el módulo está apagado. Sidebar, bottom nav y widgets del dashboard se ocultan automáticamente.

---

## Seed automático y modo producción

Al arrancar la app, `seed.ts` comprueba si ya existen tenants:

- **Sin datos** → siembra: 2 boxes de ejemplo (CrossFit Norte y BoxFit), super admin, usuarios con contraseña `demo1234`, planes, 2 semanas de sesiones, PRs, WODs y posts.
- **Con datos** → no toca nada (idempotente).

En Configuración → Datos, el admin puede pulsar **"Eliminar datos de demostración"**: borra únicamente los datos generados por seed y deja la app funcional y vacía para producción.

El super admin tiene un botón **"Modo producción"** que aplica lo mismo a todos los boxes demo.

---

## Módulos importantes (dónde vive qué)

- `src/lib/constants.ts` — números mágicos centralizados.
- `src/lib/date.ts` — todas las utilidades de fecha operan en horario **local** (nunca `toISOString` para claves `YYYY-MM-DD`).
- `src/lib/format.ts` — dinero, tiempo y números.
- `src/lib/image.ts` — compresión de imágenes (canvas) antes de guardar como base64.
- `src/lib/themes.ts` — 5 temas + aplicación vía CSS variables.
- `src/lib/crypto.ts` — SHA-256 (Web Crypto), OTP y códigos de invitación.
- `src/lib/data-bus.ts` — bus `Event`-based para refrescar UI tras cambios.

---

## Guía de migración a Supabase (paso a paso)

Cuando se quiera pasar de demo a producción real:

1. **Habilitar Lovable Cloud** (Supabase debajo). Crear las tablas siguiendo el modelo de arriba, todas con columna `tenant_id UUID NOT NULL`.
2. **Row Level Security** en todas las tablas:
   ```sql
   ALTER TABLE public.<t> ENABLE ROW LEVEL SECURITY;
   CREATE POLICY tenant_isolation ON public.<t>
     FOR ALL TO authenticated
     USING (tenant_id = (SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()));
   ```
   Roles en tabla aparte `user_roles(user_id, tenant_id, role app_role)` con función `has_role()` `SECURITY DEFINER`.
3. **Auth**: reemplazar `src/lib/services/auth.service.ts` por llamadas a `supabase.auth.signUp` / `signInWithPassword` / `resetPasswordForEmail`. El hashing SHA-256 desaparece.
4. **Repositorios**: cada `*.repo.ts` se reescribe como wrapper de `supabase.from('<tabla>').select/insert/update/delete`. La firma pública (`list`, `getById`, `create`, `update`, `remove`, `query`) puede mantenerse casi idéntica → **los servicios no cambian**.
5. **Sesión**: `sessionStore` pasa a leer `supabase.auth.getSession()`. El `tenantId` sale del claim custom `user_metadata.tenant_id` o de `user_roles`.
6. **Realtime** (opcional): sustituir `data-bus` por `supabase.channel().on('postgres_changes')` para invalidar queries.
7. **Storage**: los base64 de logos/posts pasan a `supabase.storage.from('media')`; se sirve URL pública.
8. **Backup/Import**: se convierten en Edge Functions que copian filas entre tenants con `SECURITY DEFINER`.

Como los componentes ya solo hablan con **servicios**, la mayor parte del código de UI no requiere ningún cambio.

---

## Desarrollo

```bash
bun install
bun run dev
```

Typecheck:

```bash
bunx tsgo --noEmit
```

---

## Cuentas demo (sembradas por defecto)

| Rol | Email | Password |
| --- | --- | --- |
| Super admin | `super@fitbox.app` | `demo1234` |
| Admin (CrossFit Norte) | `admin@crossfitnorte.com` | `demo1234` |
| Coach | `coach@crossfitnorte.com` | `demo1234` |
| Socio | `sara@crossfitnorte.com` | `demo1234` |
