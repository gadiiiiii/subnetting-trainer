import Link from "next/link";
import { FlameIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Marca, pestañas de modo y racha de días. */
export default function BarraSuperior({
  actual,
  racha,
}: {
  actual: "practica" | "examen";
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
      <div className="mx-auto flex max-w-[44rem] items-end justify-between gap-4 px-4 pt-4">
        <div className="flex items-end gap-6">
          <p className="titulo pb-3 font-bold">
            Subnetting<span className="text-red">/</span>
            <span className="text-muted-foreground">CCNA</span>
          </p>
          <nav className="flex gap-4" aria-label="Modo">
            {pestaña("/", "Práctica", actual === "practica")}
            {pestaña("/examen", "Examen", actual === "examen")}
          </nav>
        </div>
        <p
          className={cn(
            "mb-3 inline-flex items-center gap-1 font-mono text-sm font-bold",
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
