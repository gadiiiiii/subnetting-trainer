"use client";

import { useEffect, useState } from "react";
import { TimerIcon } from "lucide-react";
import { formatearTiempo } from "@/lib/examen";
import { cn } from "@/lib/utils";

/** Tiempo transcurrido desde `desde` (ms). Si `hasta` viene, queda detenido. */
export default function Reloj({ desde, hasta, etiqueta }: { desde: number; hasta?: number | null; etiqueta: string }) {
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    if (hasta) return;
    const id = setInterval(() => setAhora(Date.now()), 250);
    return () => clearInterval(id);
  }, [hasta]);

  const segundos = Math.floor(((hasta ?? ahora) - desde) / 1000);
  return (
    <span
      role="timer"
      aria-label={etiqueta}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-base font-bold tabular-nums",
        hasta ? "border-red bg-red-soft text-red" : "border-border bg-card text-foreground",
      )}
    >
      <TimerIcon className="size-4" aria-hidden="true" />
      {formatearTiempo(segundos)}
    </span>
  );
}
