# Despliegue

FitBox es una SPA / SSR-ready sobre TanStack Start. Se puede publicar de tres formas:

1. **Publicar desde Lovable** (recomendado para la demo).
2. **Desplegar el build estático** en cualquier hosting.
3. **Self-hosting** con Node/Bun sirviendo el servidor de TanStack Start.

---

## 1. Publicar desde Lovable

Este proyecto vive en Lovable con sincronización a GitHub. Para publicar:

1. Abre el proyecto en el editor de Lovable.
2. Pulsa el botón **Publish** (arriba a la derecha en desktop, esquina
   inferior derecha en móvil dentro de Preview).
3. En el diálogo:
   - La primera vez, Lovable crea un subdominio `*.lovable.app`.
   - Después, cada publicación es un click en **Update**.

Puedes conectar un dominio propio desde **Project Settings → Domains** una vez
publicado por primera vez.

> **Nota:** los cambios de frontend requieren pulsar *Update* en el diálogo
> de publicación para llegar a producción.

---

## 2. Build estático

Cualquier hosting que sirva archivos estáticos (Netlify, Vercel, Cloudflare
Pages, S3+CloudFront, etc.) sirve para publicar la demo, ya que toda la
persistencia vive en el navegador.

```bash
bun install
bun run build
```

Sube el contenido de `dist/` (o el output que genere `vite build` según la
configuración de TanStack Start) al hosting.

**Fallback SPA:** configura el hosting para que las rutas desconocidas
sirvan `index.html`. TanStack Router se encarga del resto en cliente.

---

## 3. Self-hosting con SSR

TanStack Start soporta SSR y adaptadores (Node, Bun, workers). Consulta la
[guía oficial de deploy de TanStack Start](https://tanstack.com/start/latest/docs/framework/react/hosting)
para elegir el adaptador que encaje.

Pasos generales:

```bash
bun install
bun run build
bun run preview   # arranque local para validar el build
```

Después arranca el servidor generado con el adaptador correspondiente.

---

## Checklist de pre-flight (antes de publicar en producción)

- [ ] Editado `src/config/company.ts` con la denominación social, CIF,
      dirección, ciudad de jurisdicción y correos reales.
- [ ] Revisadas y ajustadas las páginas de `src/routes/legal.*` por un
      profesional jurídico.
- [ ] Sustituidos o eliminados los usuarios demo (Super admin,
      `admin@crossfitnorte.com`, etc.) o desactivado el auto-seed antes de
      exponer la app públicamente.
- [ ] Verificado que `bun run build` termina sin warnings ni errores.
- [ ] Ejecutado `bunx tsgo --noEmit` sin errores.
- [ ] Comprobados los flujos críticos en el build de producción
      (`bun run preview`): login, registro, reserva, pago manual,
      export/import de backup, panel super admin.
- [ ] Revisadas las metatags de la landing en `src/routes/__root.tsx`
      (título, descripción, og:image, favicon).
- [ ] Configurado un dominio propio (opcional) y HTTPS.

---

## Consideraciones importantes

- **Datos en el navegador**: en esta demo todos los datos viven en
  `localStorage`. No es apto para producción real con usuarios finales
  reales. Antes de operar, sigue la *Guía de migración a Supabase* en
  [`ARCHITECTURE.md`](./ARCHITECTURE.md).
- **PWA**: el proyecto ya incluye `public/manifest.webmanifest` e iconos.
  Al servirse sobre HTTPS los navegadores lo detectan como instalable sin
  configuración adicional.
- **Copia de seguridad**: al ser cliente-only, no existe backup automático.
  El propio admin puede exportar/importar en **Configuración → Datos**.
