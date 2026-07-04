# FASE 9: Cuentas, Legales y Ajuste de Color

Fase grande dividida en 6 bloques. Toda la persistencia sigue en localStorage con la arquitectura repos + servicios. UI en español.

## 1. Corrección de color en la landing

Reinterpretar "más color" como acentos cálidos dentro de la gama naranja, no como paleta multicolor.

- Quitar de `LandingPage.tsx` y `styles.css` todo uso de cyan, magenta/rosa y esmeralda: gradientes de features, chips de iconos por sección, bordes multicolor.
- Iconos de features: tratamiento único naranja/monocromo (chip `bg-primary/10 text-primary` con borde sutil).
- Hero: gradiente radial cálido naranja → ámbar → fondo, glow suave naranja en hover de cards.
- Mantener intactos:
  - Gradiente de la sección de precios.
  - Animaciones de scroll (`IntersectionObserver`, stagger, parallax del mockup).
  - PWA / manifest.
- Revisar y unificar en `styles.css` variables/keyframes (`fb-gradient-shift`) para que solo trabajen con la escala naranja.

## 2. Autenticación real simulada

Reemplazar el "selector de usuario" por login/registro/recuperación con hash y estados.

Modelo:
- `User` gana: `email`, `passwordHash` (SHA-256 vía `crypto.subtle`), `status: 'active' | 'invited' | 'pending'`.
- Migración transparente en `users.repo.ts`: usuarios demo previos reciben `demo1234` hasheado y `status: 'active'`; también sigue mapeando `owner → admin`.

Servicios:
- `src/lib/services/auth.service.ts`: `register`, `loginWithPassword`, `logout`, `requestPasswordReset`, `resetPassword`. Errores tipados claros (email inexistente, contraseña incorrecta, cuenta suspendida, código inválido/expirado).
- `src/lib/storage/repositories/passwordResets.repo.ts`: código 6 dígitos + `expiresAt` (15 min) + `userId`.

Rutas nuevas (públicas):
- `/login`: email + contraseña, links a `/recuperar` y `/registro`, panel discreto "Cuentas de prueba" que solo aparece si hay seed demo (lista emails demo y aclara `demo1234`).
- `/registro`: registro de OWNER (nombre, email, contraseña, nombre del box) → crea tenant vacío + user admin → redirige a onboarding owner.
- `/recuperar`: 3 pasos (email → código → nueva contraseña). Como no hay email real, mostrar panel "Modo demo: tu código es XXXXXX" durante el paso 2.

Ajustes UI:
- Eliminar el user switcher del `Header`. Mantener menú de cuenta con "Cerrar sesión" y acceso a `/mi-cuenta`.
- El super admin entra por `/login` con su email (ya en seed).
- CTAs de la landing → `/registro`. Añadir "Iniciar sesión" al nav de la landing.
- `AuthContext` pasa a exponer `login/register/logout/requestReset/resetPassword` reales; se elimina el modo "elegir usuario".

## 3. Invitaciones de socios

- Tipo `Invitation` + `invitations.repo.ts`: `tenantId`, `email?`, `role: 'coach'|'member'`, `code` (8 chars legibles sin ambigüedad), `status`, `expiresAt` (+7 días), `invitedBy`, `planId?`.
- `invitations.service.ts`: `create`, `revoke`, `regenerate`, `validate(code)`, `accept(code, { name, email, password })`.
- UI en `/socios` (admin/coach): botón "Invitar socio" → dialog con rol, plan opcional, genera código + link copiable (`/invitacion/$code`). Tab/sección "Invitaciones pendientes" con acciones revocar/regenerar y estado.
- Ruta pública `/invitacion/$code`: valida (inválido/expirado/revocado con mensaje claro), muestra nombre + logo del box, formulario crear cuenta → user con rol/plan preasignado y `status: 'active'` → onboarding socio.

## 4. Onboardings

- `src/routes/onboarding.owner.tsx` (4 pasos con barra de progreso):
  1. Datos del box: nombre, color, tema (los 5 existentes), logo (URL o upload local a base64).
  2. Horario tipo: checkboxes de franjas (L-V mañana/mediodía/tarde/noche, sáb mañana) → genera plantillas y 2 semanas de sesiones.
  3. Planes: los 3 default editables + añadir propios.
  4. Invita socios: crea invitaciones (opcional, "Saltar" permitido).
  Al terminar → `/dashboard` con widget "Primeros pasos" (checklist: crear clase ✓ auto, invitar socio, publicar primer post) persistido por tenant.
- `src/routes/onboarding.member.tsx` (2 pasos):
  1. Perfil: avatar opcional + objetivo (`fuerza | perder_peso | resistencia | general`).
  2. Guía rápida: cómo reservar y ver el WOD.
  Objetivo persistido en `User.profile.goal`; visible en la ficha del socio para el coach.

## 5. Navegación del socio y "Mi cuenta"

- Para role `member`: landing tras login = `/feed`. Orden en sidebar/bottom nav: Feed, Reservas, PRs, Mi cuenta.
- Admin/coach mantienen dashboard clásico.
- Nueva ruta `/mi-cuenta`: perfil editable (nombre, avatar, objetivo), membresía + créditos, próximas reservas, cambiar contraseña (form aparte que reusa `auth.service`).
- `AppLayout` decide destino post-login según rol.

## 6. Legales + cookies

- Rutas `/legal/privacidad`, `/legal/cookies`, `/legal/terminos`, `/legal/aviso-legal` con layout compartido `LegalLayout` (índice lateral sticky en `md+`, tipografía legible, fecha de última actualización, aviso "Plantilla — revisar con profesional").
- Contenido serio en español para SaaS de gestión de gimnasios: responsable ([NOMBRE EMPRESA]/[CIF]/[DIRECCIÓN]/[EMAIL]), base legal RGPD, derechos ARCO-POL, categorías de datos, encargados de tratamiento, cookies (técnicas + preferencia + analítica opcional), propiedad intelectual, limitación de responsabilidad, ley aplicable española y jurisdicción.
- `CookieBanner` en el `__root`: aparece si `localStorage.cookieConsent` está vacío; botones Aceptar / Rechazar / Preferencias (dialog con toggles técnicas obligatorias + preferencia + analítica); guarda decisión y no vuelve a mostrarse. Link a `/legal/cookies`.
- Footer de la landing con los 4 links + enlaces de producto (Precios, Funciones, Iniciar sesión, Registro).

## Detalles técnicos

- `crypto.subtle.digest('SHA-256', …)` + hex encoding en `src/lib/crypto.ts` (helper aislado, `async`).
- Todas las rutas nuevas usan `createFileRoute` con path exacto (respetando reglas de TanStack) y `head()` propio con `title` y `description`.
- Ruta parametrizada: `src/routes/invitacion.$code.tsx` → `createFileRoute("/invitacion/$code")`.
- Onboardings y legales son rutas top-level, no bajo `_authenticated`, salvo el owner (protegido tras registro por sesión ya creada).
- Cookie consent es un componente cliente; se monta en `__root.tsx` fuera del `Outlet` para verse en toda la app.
- El typecheck (`bunx tsgo --noEmit`) debe pasar limpio.
- Verificación Playwright del flujo: registro owner → onboarding → invitar → aceptar invitación → onboarding socio → feed → reservar → logout → login → recuperar contraseña con código visible.

## Archivos principales

Nuevos:
- `src/lib/crypto.ts`
- `src/lib/services/auth.service.ts`
- `src/lib/services/invitations.service.ts`
- `src/lib/storage/repositories/passwordResets.repo.ts`
- `src/lib/storage/repositories/invitations.repo.ts`
- `src/routes/login.tsx`, `registro.tsx`, `recuperar.tsx`
- `src/routes/invitacion.$code.tsx`
- `src/routes/onboarding.owner.tsx`, `onboarding.member.tsx`
- `src/routes/mi-cuenta.tsx`
- `src/routes/legal.privacidad.tsx`, `legal.cookies.tsx`, `legal.terminos.tsx`, `legal.aviso-legal.tsx`
- `src/components/legal/LegalLayout.tsx`
- `src/components/legal/CookieBanner.tsx`
- `src/components/auth/AuthForms.tsx` (piezas comunes)
- `src/components/socios/InviteMemberDialog.tsx`, `PendingInvitations.tsx`
- `src/components/onboarding/OwnerWizard.tsx`, `MemberWizard.tsx`, `FirstStepsChecklist.tsx`
- `src/components/landing/LandingFooter.tsx` (si no existe)

Editados:
- `src/types/index.ts` (User, Invitation, goal, status)
- `src/lib/storage/repositories/users.repo.ts` (migración owner→admin + password demo)
- `src/lib/seed.ts` (passwords demo, invitaciones de ejemplo, super admin con password)
- `src/contexts/AuthContext.tsx` (login real, quita user switcher)
- `src/components/layout/Header.tsx`, `Sidebar.tsx`, `MobileNav.tsx` (fuera switcher, orden member)
- `src/components/landing/LandingPage.tsx` + `src/styles.css` (recolorización naranja)
- `src/routes/__root.tsx` (CookieBanner + guardas)
- `src/routes/socios.tsx`, `dashboard.tsx`, `index.tsx` (redirección por rol)
