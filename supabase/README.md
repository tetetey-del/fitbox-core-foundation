# Base de datos de Kinflow (Supabase)

Proyecto: `zkbdwngmttgfstquzuek` (región eu-west-1, Irlanda).

- `schema.sql`: estructura completa (tablas, funciones, permisos RLS y triggers), tal como está aplicada.
- La app guarda todas sus colecciones en `public.records` (una fila por registro, `data` en JSON).
- `public.tenants`: un registro por box. `public.tenant_users`: qué cuenta de Supabase Auth pertenece a qué box y con qué rol.
- Al crearse una cuenta, el trigger `kf_handle_new_user` crea el box (si viene `box_name`) o une a la persona al box de la invitación (si viene `invitation_code`).

Permisos (RLS):
- **Staff (admin y coach):** leen y escriben todo lo de su box.
- **Socios:** leen clases, planes, feed, WODs, tienda, retos, rutinas, ejercicios, reservas, check-ins y marcas; del resto, solo lo propio. De los demás socios solo ven nombre, foto y rol (`kf_directory`). Pueden escribir solo sus propios registros en: ficha, marcas, mediciones, pedidos, notificaciones, rutinas y retos. No pueden cambiarse el rol, el estado ni el email.

La demo (cuentas @kinflow.app de la landing) no usa Supabase: vive en el navegador.
