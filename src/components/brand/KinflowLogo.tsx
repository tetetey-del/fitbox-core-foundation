/**
 * Logo de Kinflow: "la K en movimiento". La K es una persona saltando: el punto lima es la cabeza,
 * el palo es el cuerpo, arriba un brazo estirado y abajo una pierna.
 * `KinflowMark` es solo el símbolo; `KinflowLogo` es símbolo + nombre.
 */

export function KinflowMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Kinflow">
      <rect x="2" y="2" width="60" height="60" rx="16" fill="#14B8A6" />
      <g transform="rotate(12 32 34)">
        <circle cx="23" cy="14" r="5.5" fill="#A3E635" />
        <path d="M23 24v26" stroke="#0E2A3A" strokeWidth="6.5" strokeLinecap="round" fill="none" />
        <path d="M23 31C31 28 38 22 45 15" stroke="#0E2A3A" strokeWidth="6.5" strokeLinecap="round" fill="none" />
        <path d="M23 35C31 38 39 44 46 50" stroke="#0E2A3A" strokeWidth="6.5" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  );
}

export function KinflowLogo({ markClassName = "h-6 w-6" }: { markClassName?: string }) {
  return (
    <span className="flex items-center gap-2">
      <KinflowMark className={markClassName} />
      <span className="font-semibold tracking-tight">Kinflow</span>
    </span>
  );
}
