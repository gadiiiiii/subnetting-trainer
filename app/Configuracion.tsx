"use client";

import { NOMBRE_DIFICULTAD, type Dificultad } from "@/lib/ejercicio";
import { SELECCIONES, nombreSeleccion, type Seleccion } from "@/lib/tipos";

/** Selector de tipo de ejercicio y dificultad, compartido por práctica y examen. */
export default function Configuracion({
  seleccion,
  dificultad,
  onSeleccion,
  onDificultad,
  children,
}: {
  seleccion: Seleccion;
  dificultad: Dificultad;
  onSeleccion: (s: Seleccion) => void;
  onDificultad: (d: Dificultad) => void;
  children?: React.ReactNode;
}) {
  return (
    <section className="configuracion" aria-label="Configuración">
      <div className="tipos" role="radiogroup" aria-label="Tipo de ejercicio">
        {SELECCIONES.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={seleccion === s}
            className={s === "mixto" ? "tipo-mixto" : undefined}
            onClick={() => s !== seleccion && onSeleccion(s)}
          >
            {nombreSeleccion(s)}
          </button>
        ))}
      </div>
      <div className="configuracion-fila">
        <div className="dificultad" role="radiogroup" aria-label="Dificultad">
          {(Object.keys(NOMBRE_DIFICULTAD) as Dificultad[]).map((d) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={dificultad === d}
              onClick={() => d !== dificultad && onDificultad(d)}
            >
              {NOMBRE_DIFICULTAD[d]}
            </button>
          ))}
        </div>
        {children}
      </div>
    </section>
  );
}
