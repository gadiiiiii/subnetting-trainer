"use client";

import { useEffect, useState } from "react";
import { formatearTiempo } from "@/lib/examen";

/** Muestra el tiempo transcurrido desde `desde` (ms). Si `hasta` viene, queda detenido. */
export default function Reloj({ desde, hasta, etiqueta }: { desde: number; hasta?: number | null; etiqueta: string }) {
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    if (hasta) return;
    const id = setInterval(() => setAhora(Date.now()), 250);
    return () => clearInterval(id);
  }, [hasta]);

  const segundos = Math.floor(((hasta ?? ahora) - desde) / 1000);
  return (
    <span className={`reloj${hasta ? " reloj-detenido" : ""}`} role="timer" aria-label={etiqueta}>
      {formatearTiempo(segundos)}
    </span>
  );
}
