import { cn } from "@/lib/utils";

/**
 * Los 8 grupos de una dirección IPv6 en una grilla. Cada dígito puede
 * marcarse como red (naranjo) o interfaz (azul), y cada grupo resaltarse.
 */
export default function GruposHex({
  grupos,
  prefijo,
  resaltados = [],
  apagados = [],
  ceros = "normal",
  etiqueta,
}: {
  /** 8 grupos de 4 dígitos hexadecimales. */
  grupos: string[];
  /** Si viene, colorea cada dígito según caiga antes o después del prefijo. */
  prefijo?: number;
  /** Índices de grupo destacados (por ejemplo, la secuencia que se reemplaza por ::). */
  resaltados?: number[];
  /** Índices de grupo atenuados. */
  apagados?: number[];
  /** "atenuados": los ceros a la izquierda de cada grupo se ven más suaves. */
  ceros?: "normal" | "atenuados";
  etiqueta: string;
}) {
  return (
    <div
      role="img"
      aria-label={`${etiqueta}: ${grupos.join(":")}`}
      className="grid grid-cols-4 gap-1.5 pt-1 font-mono text-sm sm:grid-cols-8 sm:text-[0.9375rem]"
    >
      {grupos.map((g, i) => {
        const inicioCeros = ceros === "atenuados" ? g.length - (g.replace(/^0+/, "") || "0").length : 0;
        return (
          <span
            key={i}
            aria-hidden="true"
            className={cn(
              "flex flex-col items-center rounded-sm border px-1 py-1.5",
              resaltados.includes(i) ? "border-red bg-red-soft" : "border-border bg-card",
              apagados.includes(i) && "opacity-50",
            )}
          >
            <span className="flex">
              {g.split("").map((d, j) => {
                const bit = (i * 4 + j) * 4;
                const clase =
                  prefijo === undefined
                    ? undefined
                    : bit + 4 <= prefijo
                      ? "bg-red-soft font-bold text-red"
                      : bit < prefijo
                        ? "bg-red-soft font-bold text-red underline decoration-2 underline-offset-2"
                        : "bg-host-soft text-host";
                return (
                  <span
                    key={j}
                    className={cn(
                      "w-[1.1ch] text-center",
                      clase,
                      resaltados.includes(i) && prefijo === undefined && "font-bold text-red",
                      j < inicioCeros && "text-muted-foreground/60",
                    )}
                  >
                    {d}
                  </span>
                );
              })}
            </span>
            <span className="mt-0.5 font-sans text-[0.6875rem] text-muted-foreground">{i + 1}</span>
          </span>
        );
      })}
    </div>
  );
}
