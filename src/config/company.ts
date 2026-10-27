/**
 * Configuración centralizada de la empresa titular de la instancia de Kinflow.
 *
 * ESTE ES EL ÚNICO LUGAR donde deben editarse los datos legales, de contacto
 * y de créditos que se muestran en la aplicación (footer, páginas legales,
 * página de contacto si existiese, etc.). Cualquier cambio se propaga a
 * todos los componentes que consumen este módulo.
 *
 * Los valores por defecto son placeholders ficticios; sustitúyelos por los
 * datos reales de tu empresa antes de publicar la instancia en producción.
 */

export const company = {
  /** Nombre comercial que ve el público. */
  tradeName: "Kinflow",
  /** Titular legal: persona física (autónoma) o razón social si se crea una empresa. */
  legalName: "Celeste Teyssedou",
  /** NIF del titular. Completar al darse de alta como autónoma. */
  taxId: "pendiente de alta",
  /** Domicilio. Por ahora solo la ciudad; completar al darse de alta. */
  address: "Palma de Mallorca, Illes Balears (España)",
  /** Ciudad utilizada en cláusulas de jurisdicción. */
  jurisdiction: "Palma de Mallorca",
  /** Datos del Registro Mercantil. Vacío para una autónoma (no se inscribe); completar solo si es una empresa. */
  registryData: "",
  /** Correos electrónicos de contacto por área. */
  emails: {
    contact: "hola.kinflow@gmail.com",
    privacy: "hola.kinflow@gmail.com",
    support: "hola.kinflow@gmail.com",
  },
  /** Horario de atención al cliente. */
  businessHours: "Lunes a viernes, 9:00 a 18:00 (hora de España)",
} as const;

/** Créditos que se muestran al pie de la landing. */
export const credits = {
  madeBy: "Kinflow",
} as const;
