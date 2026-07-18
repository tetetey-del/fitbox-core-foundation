# FitBox

**Aplicación SaaS multi-tenant** para la gestión integral de boxes de CrossFit y estudios de entrenamiento funcional: reservas con lista de espera, membresías y créditos, PRs con leaderboard, feed interno, WODs, retos, rutinas, tienda de recogida en el box, seguimiento de salud y panel de super-admin.

Este proyecto es una **demo funcional 100 % en el navegador**: toda la persistencia vive en `localStorage`, lo que lo convierte en un excelente template *remix-ready* para arrancar un producto, aprender la arquitectura de un SaaS moderno con TanStack Start, o servir como base para migrar a un backend real (Supabase, Postgres + edge functions, etc.).

Un producto de [Vivir de IA](https://vivirdeia.com) · Creado por [Isaac Wesley](https://www.linkedin.com/in/isaacwesleey/).

---

## Stack

| Capa | Tecnología |
| --- | --- |
| Framework | **TanStack Start v1** (React 19, SSR-ready) |
| Bundler | **Vite 8** + `@tailwindcss/vite` |
| Router | TanStack Router (file-based, `src/routes/`) |
| Estado servidor | TanStack Query |
| UI | Tailwind CSS v4 + shadcn/ui + Lucide (`strokeWidth={1.5}`) |
| Formularios | React Hook Form + Zod |
| Gráficas | Recharts (lazy-loaded) |
| Animación | Framer Motion (sutil) |
| Persistencia | `localStorage` con capa de repositorios tipada |
| Auth (demo) | SHA-256 con `Web Crypto API`, sesión en `localStorage` |
| Notificaciones | `sonner` (toasts) + campana interna |

---

## Requisitos

- **Node.js 20+** (o Bun 1.x recomendado)
- Un navegador moderno (Chrome, Firefox, Edge, Safari)

---

## Instalación y desarrollo

```bash
# 1. Instalar dependencias
bun install
# o: npm install / pnpm install

# 2. Arrancar el servidor de desarrollo (http://localhost:5173)
bun run dev
```

En el primer arranque, la aplicación se auto-siembra con dos boxes demo, planes, socios, WODs y notificaciones. No hace falta configurar nada.

### Scripts disponibles

| Script | Descripción |
| --- | --- |
| `bun run dev` | Servidor de desarrollo con HMR |
| `bun run build` | Build de producción |
| `bun run build:dev` | Build en modo desarrollo (sourcemaps completos) |
| `bun run preview` | Sirve el build de producción localmente |
| `bun run lint` | ESLint sobre todo el proyecto |
| `bun run format` | Prettier `--write` |

Para el typecheck estricto usa:

```bash
bunx tsgo --noEmit
```

---

## Cuentas demo

Todas las cuentas sembradas comparten contraseña `demo1234`.

| Rol | Email | Descripción |
| --- | --- | --- |
| Super admin | `super@fitbox.app` | Panel `/admin` global e impersonación |
| Admin (CrossFit Norte) | `admin@crossfitnorte.com` | Dueño del box |
| Coach | `coach@crossfitnorte.com` | Staff |
| Socio | `sara@crossfitnorte.com` | Miembro con membresía activa |

Para volver a un estado limpio: **Configuración → Datos → "Eliminar datos de demostración"** o borra el `localStorage` del dominio.

---

## Arquitectura por capas

```
┌──────────────────────────────┐
│      Rutas / Páginas         │  src/routes/*.tsx  (TanStack Router)
└─────────────┬────────────────┘
              │
┌─────────────▼────────────────┐
│   Componentes de dominio     │  src/components/{booking,members,prs,feed,...}
└─────────────┬────────────────┘
              │
┌─────────────▼────────────────┐
│   Hooks / Contexts           │  src/hooks/*, src/contexts/AuthContext
└─────────────┬────────────────┘
              │
┌─────────────▼────────────────┐
│        SERVICIOS             │  src/lib/services/*.service.ts
│  (única fuente de lógica     │
│   de negocio)                │
└─────────────┬────────────────┘
              │
┌─────────────▼────────────────┐
│      REPOSITORIES            │  src/lib/storage/repositories/*.repo.ts
│  CRUD tipado + scoping tenant│
└─────────────┬────────────────┘
              │
┌─────────────▼────────────────┐
│           db.ts              │  src/lib/storage/db.ts
└─────────────┬────────────────┘
              │
┌─────────────▼────────────────┐
│        localStorage          │  claves fitbox:*
└──────────────────────────────┘
```

**Regla de oro:** los componentes hablan con **servicios**; los servicios hablan con **repositorios**; los repositorios son los únicos que tocan `db` (y por ende `localStorage`).

Consulta [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) para las decisiones de diseño en profundidad.

---

## Configuración de la empresa titular

Los datos legales, de contacto y créditos que aparecen en el footer y en las páginas legales están centralizados en **un único fichero**:

```
src/config/company.ts
```

Antes de publicar tu propia instancia edita ese fichero con la denominación social, CIF, dirección, ciudad de jurisdicción y correos de contacto reales. Cualquier cambio se propaga automáticamente a todo el frontend.

---

## Rutas principales

Públicas: `/` (landing), `/login`, `/registro`, `/recuperar`, `/invitacion/$code`, `/legal/*`.

Autenticadas: `/dashboard`, `/feed`, `/reservas`, `/clases`, `/socios`, `/prs`, `/retos`, `/rutinas`, `/tienda`, `/mi-cuenta`, `/configuracion`, `/onboarding/owner`, `/onboarding/member`.

Super-admin: `/admin`.

---

## Multitenancy

Cada tenant tiene su propio **espacio de claves** en `localStorage`:

```
fitbox:<tenantId>:<collection>     → colecciones scoped por tenant
fitbox:__global__:<collection>     → global (tenants, super admins)
fitbox:session                     → sesión del usuario logueado
fitbox:super_session               → sesión del super_admin
```

Un super admin puede **impersonar** cualquier tenant sin perder su sesión global.

---

## Roles

| Capacidad | `super_admin` | `admin` | `coach` | `member` |
| --- | :---: | :---: | :---: | :---: |
| Panel `/admin` | ✅ | – | – | – |
| Impersonar tenants | ✅ | – | – | – |
| Configurar el box | – | ✅ | – | – |
| Invitar socios y coaches | – | ✅ | – | – |
| Crear clases y WODs | – | ✅ | ✅ | – |
| Check-in de asistentes | – | ✅ | ✅ | – |
| Reservar clase | – | ✅ | ✅ | ✅ |
| Registrar PRs propios | – | ✅ | ✅ | ✅ |

---

## Módulos activables

Cada tenant puede activar/desactivar módulos desde **Configuración → Módulos**:

`reservas`, `socios`, `prs`, `feed`, `pagos`, `challenges`, `programs`, `shop`, `health`.

Cuando un módulo está apagado desaparece de la navegación, del dashboard y sus rutas devuelven un fallback.

---

## Publicar y desplegar

Consulta [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) para el proceso completo, incluida la publicación desde Lovable y las opciones de self-hosting.

---

## Contribuir

Consulta [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md). Este repositorio está **sincronizado bidireccionalmente con Lovable**: cualquier commit se refleja en el proyecto Lovable y viceversa.

---

## Licencia

Este proyecto se publica como referencia y punto de partida. Antes de reutilizarlo para un producto comercial, revisa las dependencias, actualiza los textos legales y sustituye las cuentas y datos demo por los tuyos.
