import { cn } from "@/lib/utils";

/**
 * Una dirección de 32 bits dibujada bit por bit, separada en octetos. Los
 * bits de red van en naranjo y los de host en azul, con una línea en el
 * límite que marca el prefijo.
 */

export interface FilaBits {
  etiqueta: string;
  bits: string;
  decimal: string;
  destacada?: boolean;
}

export default function TiraBits({ filas, prefijo }: { filas: FilaBits[]; prefijo: number }) {
  return (
    <div
      role="table"
      aria-label={`Direcciones en binario, prefijo /${prefijo}`}
      className="mt-4 overflow-x-auto rounded-lg border border-border bg-card px-3 py-3 sm:px-4"
    >
      {filas.map((fila, f) => (
        <div
          key={fila.etiqueta}
          role="row"
          className={cn(
            "grid grid-cols-[1fr_auto] items-center gap-x-3 py-1.5 sm:grid-cols-[5.5rem_auto_1fr]",
            fila.destacada && !filas[f - 1]?.destacada && "border-t border-dashed border-border",
          )}
        >
          <span role="rowheader" className="text-sm font-semibold text-muted-foreground">
            {fila.etiqueta}
          </span>
          <span
            role="cell"
            aria-label={fila.bits.match(/.{8}/g)!.join(".")}
            className="order-last col-span-2 mt-1 inline-flex gap-1 font-mono text-[0.78rem] whitespace-nowrap sm:order-none sm:col-span-1 sm:mt-0 sm:gap-1.5 sm:text-sm"
          >
            {[0, 1, 2, 3].map((o) => (
              <span key={o} className="inline-flex" aria-hidden="true">
                {fila.bits
                  .slice(o * 8, o * 8 + 8)
                  .split("")
                  .map((b, i) => {
                    const pos = o * 8 + i;
                    return (
                      <span
                        key={i}
                        className={cn(
                          "inline-block w-[1.15ch] text-center",
                          pos < prefijo ? "bg-red-soft font-bold text-red" : "bg-host-soft text-host",
                          pos === prefijo - 1 && prefijo % 8 !== 0 && "shadow-[2px_0_0_0_var(--foreground)]",
                        )}
                      >
                        {b}
                      </span>
                    );
                  })}
              </span>
            ))}
          </span>
          <span role="cell" className="text-right font-mono text-sm font-semibold whitespace-nowrap sm:text-left">
            {fila.decimal}
          </span>
        </div>
      ))}
    </div>
  );
}

export function LeyendaBits() {
  return (
    <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
      <span className="size-3.5 rounded-[3px] border-[1.5px] border-red bg-red-soft" aria-hidden="true" /> bits de red
      <span className="ml-3 size-3.5 rounded-[3px] border-[1.5px] border-host bg-host-soft" aria-hidden="true" /> bits de
      host
    </p>
  );
}
