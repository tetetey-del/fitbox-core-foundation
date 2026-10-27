import { cn } from "@/lib/utils";

/** Foto del usuario o, si no tiene, sus iniciales sobre un círculo de color. */
export function UserAvatar({
  name,
  src,
  className,
}: {
  name: string;
  src?: string;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className={cn(
        "relative inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#14B8A6]/15 text-[11px] font-semibold text-[#14B8A6]",
        className,
      )}
      aria-hidden
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" /> : initials}
    </span>
  );
}
