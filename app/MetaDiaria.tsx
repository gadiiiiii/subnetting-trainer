"use client";

import { Progress } from "@/components/ui/progress";

/** Barra de la meta del día, arriba de la lección. */
export default function MetaDiaria({ hechos, meta, listo }: { hechos: number; meta: number; listo: boolean }) {
  const cumplida = hechos >= meta;
  return (
    <div className="flex items-center gap-3">
      <Progress
        value={listo ? (Math.min(hechos, meta) / meta) * 100 : 0}
        aria-label="Meta del día"
        aria-valuetext={`${hechos} de ${meta} ejercicios`}
        className="h-2.5"
      />
      <p className="shrink-0 text-sm font-semibold text-muted-foreground tabular-nums">
        {listo ? (cumplida ? `Meta cumplida: ${hechos}` : `${hechos} de ${meta} hoy`) : `0 de ${meta} hoy`}
      </p>
    </div>
  );
}
