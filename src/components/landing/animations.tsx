import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Contenedor que revela su contenido con un fade+slide al entrar en viewport,
 * o inmediatamente si el usuario tiene reduced-motion activo. Usado por
 * todas las secciones de la landing.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`${className} transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
    >
      {children}
    </div>
  );
}

/**
 * Hook que anima un contador de 0 hasta `target` cuando su elemento entra
 * en viewport. Devuelve el valor actual y la ref para anclar en el DOM.
 */
export function useCounter(target: number, duration = 1200) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        const start = performance.now();
        const step = (t: number) => {
          const p = Math.min(1, (t - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setN(Math.round(target * eased));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        obs.disconnect();
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);
  return { n, ref };
}

/** Métrica animada usada en la sección de social proof. */
export function Metric({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) {
  const { n, ref } = useCounter(value);
  return (
    <div className="text-center">
      <div className="text-3xl sm:text-4xl font-semibold tracking-tight">
        <span ref={ref}>{n.toLocaleString("es-ES")}</span>
        {suffix}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
