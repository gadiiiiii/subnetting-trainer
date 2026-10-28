import Link from "next/link";
import { FlameIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Marca, pestañas de modo y racha de días. */
export default function BarraSuperior({
  actual,
  racha,
}: {
  actual: "practica" | "examen" | "progreso";
  /** null mientras no se lee el progreso guardado. */
  racha: number | null;
}) {
  const pestaña = (href: string, texto: string, activa: boolean) => (
    <Link
      href={href}
      aria-current={activa ? "page" : undefined}
      className={cn(
        "-mb-px inline-flex min-h-11 items-end border-b-[3px] px-1 pb-3 font-semibold transition-colors outline-none focus-visible:rounded-sm focus-visible:ring-[3px] focus-visible:ring-ring/60",
        activa ? "border-red text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {texto}
    </Link>
  );

  return (
    <header className="border-b border-border">
      {/* En el celular, las pestañas bajan a una segunda fila. */}
      <div className="mx-auto flex max-w-[44rem] flex-wrap items-end justify-between gap-x-6 px-4 pt-4">
        <p className="titulo order-1 pb-3 font-bold">
          Subnetting<span className="text-red">/</span>
          <span className="text-muted-foreground">CCNA</span>
        </p>
        <nav className="order-3 flex w-full gap-5 sm:order-2 sm:mr-auto sm:w-auto sm:gap-4" aria-label="Modo">
          {pestaña("/", "Práctica", actual === "practica")}
          {pestaña("/examen", "Examen", actual === "examen")}
          {pestaña("/progreso", "Progreso", actual === "progreso")}
        </nav>
        <p
          className={cn(
            "order-2 mb-3 inline-flex items-center gap-1 font-mono text-sm font-bold sm:order-3",
            racha ? "text-red" : "text-muted-foreground",
            racha === null && "invisible",
          )}
          aria-label={racha === null ? undefined : `Racha: ${racha} ${racha === 1 ? "día seguido" : "días seguidos"} practicando`}
          title="Días seguidos practicando"
        >
          <FlameIcon className="size-4" aria-hidden="true" fill={racha ? "currentColor" : "none"} />
          {racha ?? 0}
        </p>
      </div>
    </header>
  );
}
