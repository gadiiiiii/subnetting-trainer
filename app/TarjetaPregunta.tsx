import type { Enunciado } from "@/lib/ejercicio";
import { cn } from "@/lib/utils";

/** El enunciado: tipo de ejercicio, pregunta y el dato principal en grande. */
export default function TarjetaPregunta({
  tipo,
  enunciado,
  extra,
  id = "titulo-ejercicio",
}: {
  tipo: string;
  enunciado: Enunciado;
  /** Controles a la derecha del tipo: reloj, copiar enlace. */
  extra?: React.ReactNode;
  id?: string;
}) {
  const varias = enunciado.lineas.length > 1;
  return (
    <section aria-labelledby={id} className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-7">
      <div className="-mt-2 -mr-2 flex min-h-11 items-center justify-between gap-3">
        <p className="text-sm font-semibold text-red">{tipo}</p>
        {extra && <div className="flex items-center gap-1">{extra}</div>}
      </div>
      <h1 id={id} className="mt-1">
        <span className="block text-lg text-muted-foreground">{enunciado.pregunta}</span>
        {enunciado.lineas.map((l, i) => (
          <span
            key={i}
            className={cn(
              "mt-1 flex flex-wrap items-baseline gap-x-3 font-mono font-bold tracking-tight [overflow-wrap:anywhere]",
              enunciado.compacto
                ? "text-[clamp(1.15rem,4.6vw,1.6rem)] leading-snug"
                : varias
                  ? "text-[clamp(1.6rem,6vw,2.5rem)] leading-tight"
                  : "text-[clamp(2rem,8vw,3.5rem)] leading-[1.1]",
            )}
          >
            {l.etiqueta && (
              <span className="w-full font-sans text-sm font-semibold tracking-normal text-muted-foreground sm:w-20">
                {l.etiqueta}
              </span>
            )}
            <span>
              {/* Permite cortar la línea después de cada ":" en direcciones largas. */}
              {l.valor.split(":").map((parte, j, todas) => (
                <span key={j}>
                  {parte}
                  {j < todas.length - 1 && (
                    <>
                      :<wbr />
                    </>
                  )}
                </span>
              ))}
              {l.acento && <span className="text-red">{l.acento}</span>}
            </span>
          </span>
        ))}
      </h1>
      {enunciado.nota && <p className="mt-4 max-w-prose text-muted-foreground">{enunciado.nota}</p>}
    </section>
  );
}
