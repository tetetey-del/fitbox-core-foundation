import * as React from "react";
import { Input } from "@/components/ui/input";

type Props = Omit<React.ComponentProps<typeof Input>, "type" | "value" | "onChange"> & {
  value: number | string | undefined | null;
  /** Recibe el número como texto con punto decimal (ej. "19.99"), igual que un input de número. */
  onChange?: (e: { target: { value: string } }) => void;
  /** Permite decimales (precios, peso). Si no, solo enteros. */
  decimal?: boolean;
};

function toText(v: number | string | undefined | null, decimal: boolean): string {
  if (v === undefined || v === null || v === "") return "";
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  if (Number.isNaN(n)) return "";
  return decimal ? String(n).replace(".", ",") : String(Math.trunc(n));
}

function parse(text: string): number {
  return text === "" ? 0 : Number(text.replace(",", "."));
}

/**
 * Campo para escribir números sin las flechitas del navegador. Acepta coma o punto
 * decimal (19,99), se puede borrar entero y en el móvil abre el teclado numérico.
 */
export function NumberInput({ value, onChange, decimal, step, ...rest }: Props) {
  const allowDecimal = decimal ?? (step !== undefined && String(step).includes("."));
  const [text, setText] = React.useState(() => toText(value, allowDecimal));

  // Si el valor cambia desde afuera (por ejemplo, al abrir otro registro), se actualiza el texto.
  React.useEffect(() => {
    const external = value === undefined || value === null || value === "" ? 0 : Number(String(value).replace(",", "."));
    if (parse(text) !== external) setText(toText(value, allowDecimal));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <Input
      {...rest}
      type="text"
      inputMode={allowDecimal ? "decimal" : "numeric"}
      autoComplete="off"
      value={text}
      onChange={(e) => {
        let t = e.target.value.replace(/\s/g, "");
        t = allowDecimal ? t.replace(/[^\d.,]/g, "") : t.replace(/\D/g, "");
        if (allowDecimal) {
          // Un solo separador decimal y hasta 2 decimales.
          const m = t.match(/^(\d*)([.,]?)(\d{0,2})/);
          t = m ? m[1] + m[2] + m[3] : "";
        }
        setText(t);
        onChange?.({ target: { value: t === "" ? "" : t.replace(",", ".").replace(/\.$/, "") } });
      }}
    />
  );
}
