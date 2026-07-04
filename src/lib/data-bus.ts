import { useEffect, useState } from "react";

/**
 * Un mini bus para señalar cambios en repositorios y forzar refresco
 * en componentes suscritos. Simple, sin dependencias.
 */
type Listener = () => void;
const listeners = new Set<Listener>();
let version = 0;

export function notifyDataChanged() {
  version += 1;
  listeners.forEach((l) => l());
}

export function useDataVersion(): number {
  const [v, setV] = useState(version);
  useEffect(() => {
    const l = () => setV(version);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return v;
}
