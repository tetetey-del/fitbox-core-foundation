/**
 * @file Boxes gestionados por la plataforma.
 *
 * Global. `settings.modules` define qué módulos ve el tenant; `themeId` y `brandColor` controlan la identidad visual.
 */
import type { Tenant } from "@/types";
import { BaseRepo } from "./base.repo";

export const tenantsRepo = new BaseRepo<Tenant>("tenants", { scoped: false });
