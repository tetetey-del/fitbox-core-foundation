# Arquitectura y decisiones de diseño

Este documento explica **por qué** el código está estructurado así. El **qué**
está en el `README.md`.

## 1. Patrón Repository sobre localStorage

**Problema:** `localStorage` es un `Map<string, string>` global. Sin abstracción,
la lógica de negocio termina llena de `JSON.parse(localStorage.getItem(...))`,
imposible de tipar, testear o migrar.

**Solución:** una capa `BaseRepo<T>` que:

- Serializa/deserializa transparentemente.
- Genera IDs y timestamps (`newId`, `nowIso`).
- Aplica scoping por tenant (`buildKey(tenantId, collection)`).
- Expone la misma API que usaríamos con Supabase: `list / getById / query / create / update / remove / replaceAll`.

**Consecuencia:** migrar a Supabase (ver README) implica reescribir **solo** los
repos. Los servicios y los componentes no cambian de forma.

## 2. Servicios: única fuente de lógica de negocio

Los componentes son intencionadamente "tontos": renderizan y disparan
callbacks. Toda regla — ventana de cancelación, promoción de lista de espera,
consumo/devolución de créditos, dedupe de notificaciones — vive en
`src/lib/services/*.service.ts`.

Beneficios concretos ya observados:

- El botón "Cancelar reserva" en el listado del socio y en el sheet de
  detalle del staff comparten el mismo `cancelBooking(bookingId, role)`, así
  que la ventana de 2 h se aplica siempre y la devolución de crédito nunca se
  olvida.
- Cambiar la ventana de cancelación por tenant es **una sola línea** en
  `getCancellationWindow`.

## 3. Dedupe de notificaciones con `dedupeKey`

**Problema:** una sesión cancelada con 15 personas apuntadas + 5 en waitlist
notifica 20 veces. Si el admin la re-cancela por error, 40. El usuario ve
spam en la campana.

**Solución:** `notify()` acepta un `dedupeKey` opcional. Antes de crear la
notificación, se consulta si ya existe otra con esa clave para ese usuario;
si existe, se descarta silenciosamente. Ejemplo:
`dedupeKey: cancelled:${sessionId}:${userId}`.

Para las promociones de waitlist NO usamos dedupe: cada promoción es un
evento distinto y merece su notificación.

## 4. Remapeo de IDs en import de backups

**Problema:** un backup contiene `id`s como `usr_abc123`. Si al importar los
volcáramos tal cual y ya existiera un usuario con ese id (poco probable pero
posible en multi-tenant), se pisarían datos.

**Solución:** el import genera un **nuevo tenant** y construye un `Map<oldId,
newId>` por entidad. Se recorre en orden topológico (users → templates →
sessions → bookings → checkins ...) reasignando FKs con el mapa. Si un FK no
resuelve, se deja tal cual y se logea (dato huérfano en el origen).

Esto también permite importar el mismo backup varias veces sin colisión: cada
import crea un tenant `<nombre> (importado)` con sufijo timestamp en el slug.

## 5. Namespacing por tenant

`buildKey(tenantId, collection)` produce claves como
`fitbox:t_XyZ:bookings`. La ventaja: para "borrar un tenant" basta con iterar
`localStorage` y eliminar todas las claves que empiezan por el prefijo — sin
tener que cargar cada colección en memoria.

## 6. Sesión y super-sesión separadas

`sessionStore` y `superSessionStore` son dos claves distintas. Impersonar
desde super admin escribe en `sessionStore` **manteniendo** la super sesión,
así el banner de "estás impersonando" puede ofrecer "Volver al panel super"
en un click sin re-autenticar.

## 7. Fechas siempre en horario local

`toISOString()` devuelve UTC. Si un socio en Madrid reserva la clase del
`2025-07-14 07:00`, `new Date(...).toISOString().slice(0,10)` puede devolver
`2025-07-13` en verano. Todas las claves de fecha (`YYYY-MM-DD`) se
construyen con `getFullYear/getMonth/getDate` locales
(`toDateKey` en `src/lib/date.ts`). **Nunca** se debe usar `toISOString`
para construir claves de día.

## 8. Mutex de reserva

Doble-click en "Reservar" puede llegar a `bookSession` dos veces antes de
que la primera escriba la reserva confirmada (el `existing` check queda
desactualizado en el segundo tick). Como todo el storage es síncrono, un
`Set<string>` en memoria como candado por `(sessionId, userId)` es
suficiente: la primera llamada entra, la segunda ve el candado y devuelve
`{ ok: false, reason: "Reserva en curso" }`.

## 9. Compresión de imágenes

Las imágenes se guardan como data-URLs base64 dentro de `localStorage`
(quota ~5 MB por origen). Un JPG de móvil moderno puede pesar 4 MB. El
helper `compressImage()` en `src/lib/image.ts` redibuja la imagen en un
`<canvas>` con lado máximo `IMAGE_MAX_DIMENSION` y la exporta a JPEG con
`IMAGE_JPEG_QUALITY`. Después, `dataUrlBytes()` verifica que no supere el
límite del contexto (`MAX_LOGO_BYTES` para logos, `MAX_POST_IMAGE_BYTES`
para posts).

## 10. Data bus

Las mutaciones se propagan con `notifyDataChanged()` que dispara un
`CustomEvent`. Las páginas suscritas se refrescan. Es un sustituto de
Realtime que — cuando migremos a Supabase — se reemplaza por
`supabase.channel(...).on('postgres_changes', ...)` sin tocar los servicios.

## Fase 11 — Pack de fidelización

Cuatro módulos nuevos que siguen el patrón estándar (tipos → repos scoped → servicios → rutas):

- **Retos** (`challenges`) — `challenges.repo.ts` (challenges + challenge_participants) y `challenges.service.ts`. Progreso automático: los retos de asistencia leen `check-ins` dentro del periodo; los benchmark leen `personal_records` del ejercicio. `refreshChallenges()` se dispara desde el dashboard del member y desde `/retos` al cargar; cierra retos vencidos y emite `challenge_completed`.
- **Rutinas** (`programs`) — `programs.repo.ts` (programs, program_sessions, program_assignments, program_progress) y `programs.service.ts`. Bloques idénticos al modelo de WODs. Al asignar un programa se notifica con `program_assigned`.
- **Tienda** (`shop`) — `products.repo.ts` + `orders.repo.ts` y `shop.service.ts`. `createOrder` valida stock y descuenta; `setOrderStatus("cancelado")` repone. `setOrderStatus("listo")` notifica con `order_ready`. Marcado de pago sólo visible si el módulo `pagos` está activo.
- **Salud** (`health`) — `bodyMetrics.repo.ts` y `health.service.ts`. La UI vive en la pestaña "Progreso" de `/mi-cuenta` con gráficas de Recharts cargadas perezosamente. Toggle `showHealthToCoach` en el perfil (default `false`) controla visibilidad para staff.

Backup subido a `BACKUP_SCHEMA_VERSION = 2` con las 9 colecciones nuevas; se mantiene compatibilidad de import con v1 (los campos ausentes se importan como arrays vacíos y se remapean IDs por colección).
