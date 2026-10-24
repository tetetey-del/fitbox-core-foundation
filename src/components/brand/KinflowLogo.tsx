/**
 * Logo de Kinflow: una K cuyas patas forman una curva, como un movimiento que fluye.
 * `KinflowMark` es solo el símbolo; `KinflowLogo` es símbolo + nombre.
 */

export function KinflowMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Kinflow">
      <rect x="2" y="2" width="60" height="60" rx="16" fill="#14B8A6" />
      <path d="M22 16v32" stroke="#0E2A3A" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path
        d="M44 16C35 21 28 27 28 32s7 11 16 16"
        stroke="#0E2A3A"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="47" cy="32" r="3.5" fill="#A3E635" />
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
