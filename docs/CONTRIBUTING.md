# Contribuir a FitBox

¡Gracias por tu interés! Este documento resume el flujo de trabajo y las
convenciones para colaborar en el proyecto.

---

## Sincronización con Lovable

⚠️ **Este repositorio está sincronizado bidireccionalmente con Lovable.**

- Cualquier `push` a la rama por defecto se refleja en el proyecto Lovable
  al instante.
- Cualquier cambio hecho desde la interfaz de Lovable se commitea a este
  repositorio automáticamente.

Consecuencias prácticas:

- **No reescribas el historial** de la rama por defecto (rebases forzados,
  `git push --force`) sin coordinarlo antes con el resto del equipo. Puedes
  romper la sincronización.
- **Trabaja en pull requests** siempre que el cambio no sea trivial. Así
  Lovable no aplica un cambio a medias.
- Evita commits generados por el bot de Lovable en ramas de feature: si
  necesitas experimentar, crea la rama en local y no la abras en el editor
  Lovable hasta que esté lista.

---

## Requisitos

- Node.js 20+ o Bun 1.x
- Editor con soporte para TypeScript estricto (VS Code recomendado)

---

## Puesta en marcha

```bash
bun install
bun run dev
```

Antes de abrir un PR:

```bash
bun run lint
bun run format
bunx tsgo --noEmit
bun run build
```

Todos deben pasar sin warnings nuevos.

---

## Convenciones de código

- **TypeScript estricto**: no `any`, no casts innecesarios, tipos exportados
  desde `src/types`.
- **Arquitectura en capas** (ver [`ARCHITECTURE.md`](./ARCHITECTURE.md)):
  los componentes NUNCA tocan `localStorage` ni un repo directamente para
  lógica de negocio. Todo pasa por un servicio.
- **Fechas en horario local**: usa los helpers de `src/lib/date.ts`. Prohibido
  `toISOString()` para construir claves `YYYY-MM-DD`.
- **Componentes < 200 líneas**: si crece, trocéalo en subcomponentes de
  dominio.
- **Iconos**: Lucide con `strokeWidth={1.5}`. Nunca iconos rellenos.
- **Estilos**: Tailwind v4 + tokens de `src/styles.css`. No hardcodees
  colores; usa `bg-background`, `text-foreground`, etc. La única excepción
  aceptada es el naranja de marca `#F97316` en el logo y algún acento.
- **UI en español** en toda la aplicación.

---

## Estructura de commits

Formato recomendado:

```
<área>: descripción breve en imperativo

Detalle opcional (por qué, no qué).
```

Ejemplos: `booking: promocionar waitlist al cancelar`, `landing: unificar
paleta a naranja`.

---

## Datos legales y de empresa

Todos los datos de la empresa titular (nombre, CIF, dirección, contacto) y
los créditos del producto viven en `src/config/company.ts`. No añadas
strings con datos personales o de empresa en otros archivos. Si necesitas
un dato nuevo, añádelo a ese fichero y consúmelo por import.

---

## Testing manual mínimo

Antes de dar por buena una feature verifica estos flujos:

1. Registro de owner → onboarding de 4 pasos → cae en `/dashboard`.
2. Invitar socio → aceptar invitación → onboarding → cae en `/feed`.
3. Reserva de clase con y sin créditos, incluida promoción de waitlist.
4. Alta manual de pago y reset de créditos.
5. Export/Import de backup a otro tenant.
6. Login super admin → `/admin` → impersonar tenant → volver.

---

## Reportar bugs

Abre un issue con:

- Pasos para reproducirlo.
- Comportamiento esperado vs real.
- Navegador y versión.
- Contenido de `localStorage` si es relevante (elimina antes cualquier dato
  personal).
