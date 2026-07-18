# FitBox

![TanStack Start](https://img.shields.io/badge/TanStack_Start-v1-FF4154?style=flat-square)
![React 19](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-latest-000000?style=flat-square)
![Bun](https://img.shields.io/badge/Bun-1.x-FBF0DF?style=flat-square&logo=bun&logoColor=black)

**FitBox** es una base SaaS lista para producir para boxes de CrossFit y gimnasios boutique. Trae una capa de datos modular sobre `localStorage`, autenticación simulada, control de acceso por roles, gestión multi-tenant con impersonación, y una UI totalmente personalizable con modo oscuro y color de marca.

Toda la persistencia vive en el navegador, lo que convierte al proyecto en un template ideal para remixear, aprender la arquitectura de un SaaS moderno con TanStack Start, o servir como base para migrar a un backend real (Supabase, Postgres, edge functions).

Producción: https://fitbox-core-foundation.lovable.app

---

## Remix este proyecto

Al remixear FitBox obtienes una aplicación completa y funcional lista para adaptar a tu marca:

- Landing pública, sistema de cuentas, invitaciones y onboarding.
- Reservas con lista de espera, membresías por créditos y pagos manuales.
- Feed interno, WODs, PRs con leaderboard, retos, rutinas, tienda con recogida y registro de salud.
- Panel de super administrador con impersonación de tenants.
- 5 temas visuales y modo oscuro.

Pasos para dejarlo funcionando con tus datos:

1. Edita `src/config/company.ts` con la denominación social, CIF, dirección, jurisdicción y correos de contacto reales de tu empresa.
2. Personaliza el branding desde la app: entra como admin, abre **Configuración > Apariencia** y elige tema, color de marca y logo. Ajusta `public/manifest.webmanifest` y los iconos de `public/` si vas a instalarla como PWA.
3. Revisa los textos legales en `src/routes/legal.*.tsx` con un profesional jurídico.
4. Publica desde Lovable pulsando **Publish** en el editor. Después puedes conectar un dominio propio desde **Project Settings > Domains**.

---

## Características principales

- Landing pública con secciones de hero, features, precios, testimonios y FAQ.
- Autenticación local con SHA-256 y sesión persistida en el navegador.
- Sistema de invitaciones con códigos únicos de 8 caracteres y TTL de 7 días.
- Recuperación de contraseña con OTP simulado.
- Roles jerárquicos: `super_admin`, `admin`, `coach`, `member`.
- Multi-tenant simulado con espacios de claves aislados por tenant en `localStorage`.
- Impersonación de tenants desde el panel del super admin.
- Reservas con capacidad, waitlist, ventana de cancelación configurable y mutex antidoble-click.
- Membresías por créditos o ilimitadas, pagos manuales y recibos.
- PRs deportivos con leaderboard e histórico por ejercicio.
- Feed interno con posts, imágenes y likes.
- WODs programados con bloques (calentamiento, fuerza, metcon, accesorios).
- Módulos activables por tenant (retos, rutinas, tienda, salud, pagos).
- Notificaciones internas con dedupe y campana en el header.
- Backup y restore JSON completos entre tenants.
- 5 temas visuales, modo oscuro nativo y color de marca.
- PWA instalable.

---

## Stack

| Capa | Tecnología |
| --- | --- |
| Framework | TanStack Start v1 con React 19 y SSR listo |
| Bundler | Vite 8 con `@tailwindcss/vite` |
| Router | TanStack Router file-based en `src/routes/` |
| Estado servidor | TanStack Query |
| UI | Tailwind CSS v4, shadcn/ui, Lucide con `strokeWidth={1.5}` |
| Formularios | React Hook Form + Zod |
| Gráficas | Recharts (carga perezosa) |
| Animación | Framer Motion (uso sutil) |
| Persistencia | `localStorage` con patrón Repository tipado |
| Autenticación demo | SHA-256 con Web Crypto API |
| Notificaciones | `sonner` (toasts) y campana interna |
| Package manager | Bun 1.x recomendado, compatible con npm y pnpm |

---

## Requisitos

- Node.js 20 o superior, o Bun 1.x.
- Un navegador moderno (Chrome, Firefox, Edge, Safari).

---

## Instalación local

```bash
bun install
bun run dev
```

El servidor de desarrollo arranca en `http://localhost:5173`. En el primer arranque la aplicación se auto siembra con dos boxes demo, planes, socios, WODs y notificaciones. No hay que configurar nada.

Para volver a un estado limpio: **Configuración > Datos > "Eliminar datos de demostración"** o borra el `localStorage` del dominio.

---

## Scripts

| Script | Descripción |
| --- | --- |
| `bun run dev` | Servidor de desarrollo con HMR |
| `bun run build` | Build de producción |
| `bun run build:dev` | Build en modo desarrollo con sourcemaps completos |
| `bun run preview` | Sirve el build de producción localmente |
| `bun run lint` | ESLint sobre todo el proyecto |
| `bun run format` | Prettier `--write` |

Para el typecheck estricto:

```bash
bunx tsgo --noEmit
```

---

## Estructura del proyecto

```
src/
├── config/company.ts         Datos legales y créditos (fuente única)
├── contexts/                 AuthContext y otros providers
├── hooks/                    useRole, useModules, useRequireModule
├── lib/
│   ├── constants.ts          TTLs, límites, ventanas por defecto
│   ├── date.ts               Utilidades en horario local
│   ├── format.ts             Formato de dinero, tiempo, números
│   ├── crypto.ts             SHA-256, OTP y códigos de invitación
│   ├── image.ts              Compresión canvas antes de base64
│   ├── themes.ts             5 temas mediante CSS variables
│   ├── data-bus.ts           CustomEvent para refresco de UI
│   ├── seed.ts               Seed idempotente al arranque
│   ├── services/             Lógica de negocio
│   └── storage/
│       ├── db.ts             Wrapper sobre localStorage
│       ├── session.ts        Sesión del usuario
│       ├── superadmins.ts    Super sesión aparte
│       └── repositories/     CRUD tipado por colección
├── components/
│   ├── landing/              Secciones de la landing pública
│   ├── layout/               AppLayout, Sidebar, Header, MobileNav
│   ├── auth, booking, classes, feed, members, prs, wods
│   ├── config, dashboard, health, legal, notifications, onboarding
│   ├── theme, socios
│   └── ui/                   shadcn/ui
├── routes/                   File-based routing
└── types/index.ts            Entidades del dominio
```

Rutas públicas: `/`, `/login`, `/registro`, `/recuperar`, `/invitacion/$code`, `/legal/privacidad`, `/legal/cookies`, `/legal/terminos`, `/legal/aviso-legal`.

Rutas autenticadas: `/dashboard`, `/feed`, `/reservas`, `/clases`, `/socios`, `/prs`, `/retos`, `/rutinas`, `/tienda`, `/mi-cuenta`, `/configuracion`, `/onboarding/owner`, `/onboarding/member`.

Ruta de super admin: `/admin`.

---

## Cuentas de demo

Todas las cuentas sembradas comparten la contraseña `demo1234`.

| Rol | Email | Descripción |
| --- | --- | --- |
| Super admin | `super@fitbox.app` | Panel `/admin` global e impersonación |
| Admin | `admin@crossfitnorte.com` | Dueño del box CrossFit Norte |
| Coach | `coach@crossfitnorte.com` | Staff |
| Socio | `sara@crossfitnorte.com` | Miembro con membresía activa |

Estos datos son claramente ficticios y sirven solo como demo. Antes de publicar en producción, borra el seed desde **Configuración > Datos**.

---

## Despliegue

### Publicar desde Lovable

1. Abre el proyecto en el editor de Lovable.
2. Pulsa **Publish** (arriba a la derecha en desktop, esquina inferior derecha en móvil dentro de Preview).
3. La primera publicación crea un subdominio `*.lovable.app`. Después, cada actualización es un click en **Update**.
4. Para dominio propio: **Project Settings > Domains** una vez publicado por primera vez.

La instancia de referencia vive en https://fitbox-core-foundation.lovable.app.

### Build estático alternativo

Al ser una app cliente puro, puedes servir el build en Netlify, Vercel, Cloudflare Pages, S3, etc.

```bash
bun install
bun run build
```

Configura el hosting para que las rutas desconocidas sirvan `index.html` (fallback SPA). Consulta [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) para el detalle y el checklist previo.

---

## Documentación

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md): arquitectura, capa de datos, roles, multitenancy, theming y componentes clave.
- [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md): guía de contribución, convenciones y flujo Lovable + GitHub.
- [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md): despliegue, rollback y checklist previa a publicar.

---

## Créditos

FitBox es un producto de [Vivir de IA](https://vivirdeia.com), creado por [Isaac Wesley](https://www.linkedin.com/in/isaacwesleey/), desarrollado con [Lovable](https://lovable.dev).

---

## Licencia y atribución

Plantilla remixable pensada como punto de partida para tu propio producto. Los datos legales de la instancia (denominación social, CIF, dirección, jurisdicción, correos de contacto) se definen en un único archivo: `src/config/company.ts`. Antes de operar en producción, edita ese archivo con tus datos reales y revisa los textos legales bajo `src/routes/legal.*.tsx` con un profesional jurídico.
