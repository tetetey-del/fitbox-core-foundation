/**
 * @file Marca del box para el <head> de la página, también en el servidor.
 *
 * En el servidor se lee de la cookie `kf_box`; en el navegador, de lo guardado.
 * Así el iPhone ya recibe el nombre y el ícono del box al cargar la página.
 */
import { createIsomorphicFn } from "@tanstack/react-start";
import { getCookie, getRequestUrl } from "@tanstack/react-start/server";
import { BRAND_COOKIE, decodeBrandCookie, readBoxBrand, type BoxBrand } from "@/lib/boxBrand";

export interface HeadBrand {
  brand: BoxBrand | null;
  origin: string;
}

export const getHeadBrand = createIsomorphicFn()
  .server((): HeadBrand => {
    let origin = "https://kinflowapp.vercel.app";
    try {
      origin = getRequestUrl().origin;
    } catch {
      /* nada */
    }
    try {
      return { brand: decodeBrandCookie(getCookie(BRAND_COOKIE)), origin };
    } catch {
      return { brand: null, origin };
    }
  })
  .client((): HeadBrand => ({ brand: readBoxBrand(), origin: window.location.origin }));
