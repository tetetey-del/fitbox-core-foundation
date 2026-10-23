/**
 * Configuración centralizada de la empresa titular de la instancia de FitBox.
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
  /** Denominación social completa de la empresa titular. */
  legalName: "Chia Training",
  /** Identificador fiscal (CIF/NIF/VAT) de la empresa titular. */
  taxId: "[CIF/NIF]",
  /** Dirección postal completa. */
  address: "[Dirección postal de la empresa]",
  /** Ciudad utilizada en cláusulas de jurisdicción. */
  jurisdiction: "Palma de Mallorca",
  /** Datos registrales (registro mercantil, tomo, folio, hoja). */
  registryData: "[Registro Mercantil, tomo, folio, hoja]",
  /** Correos electrónicos de contacto por área. */
  emails: {
    contact: "chiatrainingc.cba@gmail.com",
    privacy: "privacidad@ejemplo.com",
    support: "soporte@ejemplo.com",
  },
  /** Horario de atención al cliente. */
  businessHours: "Lunes a viernes, 9:00 a 18:00 (hora local)",
} as const;

/**
 * Créditos del producto: quién lo desarrolla y quién lo mantiene.
 * No es un dato editable por el operador de la instancia salvo que remixee
 * el proyecto para hacerlo propio.
 */
export const credits = {
  productOf: {
    name: "Vivir de IA",
    url: "https://vivirdeia.com",
  },
  createdBy: {
    name: "Isaac Wesley",
    url: "https://www.linkedin.com/in/isaacwesleey/",
  },
} as const;
