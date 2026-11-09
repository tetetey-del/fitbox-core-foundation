import { Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP_LABEL, supportWhatsappUrl } from "@/config/app";
import { cn } from "@/lib/utils";
import { currentTerms } from "@/lib/placeTerms";

/** Contacto directo con Kinflow (WhatsApp y email). Solo lo ve el dueño del box. */
export function SupportContact({
  message,
  boxName,
  className,
  compact,
}: {
  /** Texto con el que arranca el WhatsApp. */
  message?: string;
  boxName?: string;
  className?: string;
  compact?: boolean;
}) {
  const text = message ?? `Hola, soy de ${boxName ?? `mi ${currentTerms().place}`} y tengo una consulta sobre Kinflow.`;
  const subject = `Kinflow · ${boxName ?? "Consulta"}`;
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Button asChild size={compact ? "sm" : "default"}>
        <a href={supportWhatsappUrl(text)} target="_blank" rel="noreferrer">
          <MessageCircle className="mr-2 h-4 w-4" strokeWidth={1.5} />
          WhatsApp{compact ? "" : ` · ${SUPPORT_WHATSAPP_LABEL}`}
        </a>
      </Button>
      <Button asChild variant="outline" size={compact ? "sm" : "default"}>
        <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`}>
          <Mail className="mr-2 h-4 w-4" strokeWidth={1.5} />
          {compact ? "Email" : SUPPORT_EMAIL}
        </a>
      </Button>
    </div>
  );
}
