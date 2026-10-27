"use client";

import type { CampoDef, Correccion } from "@/lib/ejercicio";

/**
 * Campos de respuesta de un ejercicio. Puede mostrarse editable, con la
 * corrección campo por campo, o con la solución.
 */
export default function Respuestas({
  campos,
  valores,
  onCambio,
  correccion,
  soloLectura = false,
  prefijoId = "",
  primerCampo,
}: {
  campos: CampoDef[];
  valores: Record<string, string>;
  onCambio?: (id: string, valor: string) => void;
  /** Si viene, se colorea cada campo y se muestra la respuesta esperada. */
  correccion?: Correccion | null;
  soloLectura?: boolean;
  /** Para que los id no se repitan cuando hay varios ejercicios en la página. */
  prefijoId?: string;
  /** Recibe el primer elemento enfocable, para mover el foco al empezar. */
  primerCampo?: React.RefObject<HTMLElement | null>;
}) {
  const marcarPrimero = (i: number) => (el: HTMLElement | null) => {
    if (i === 0 && primerCampo) primerCampo.current = el;
  };
  const unSoloCampo = campos.length === 1;
  return (
    <div className={`campos${unSoloCampo ? " campos-uno" : ""}`}>
      {campos.map((c, i) => {
        const id = `${prefijoId}${c.id}`;
        const r = correccion?.[c.id];
        const valor = valores[c.id] ?? "";
        const clase = r ? `campo campo-${r.estado}` : "campo";
        const nota = r && (
          <p id={`${id}-nota`} className="nota">
            {r.estado === "correcto" && "Correcto"}
            {r.estado === "incorrecto" && (
              <>
                Era <span className="valor">{r.esperado}</span>
              </>
            )}
            {r.estado === "vacio" && (
              <>
                Sin respuesta. Era <span className="valor">{r.esperado}</span>
              </>
            )}
            {r.estado === "formato" && (
              <>
                {r.mensaje} Era <span className="valor">{r.esperado}</span>
              </>
            )}
          </p>
        );

        if (c.entrada === "sino") {
          return (
            <div key={c.id} className={`${clase} campo-sino`}>
              <span className="etiqueta" id={`${id}-etiqueta`}>
                {c.etiqueta}
              </span>
              <div
                className="sino"
                role="radiogroup"
                aria-labelledby={`${id}-etiqueta`}
                aria-describedby={r ? `${id}-nota` : undefined}
              >
                {["Sí", "No"].map((opcion, j) => (
                  <button
                    key={opcion}
                    type="button"
                    role="radio"
                    aria-checked={valor === opcion}
                    disabled={soloLectura}
                    onClick={() => onCambio?.(c.id, opcion)}
                    ref={j === 0 ? marcarPrimero(i) : undefined}
                  >
                    {opcion}
                  </button>
                ))}
              </div>
              {nota}
            </div>
          );
        }

        return (
          <div key={c.id} className={clase}>
            <label htmlFor={id}>{c.etiqueta}</label>
            <input
              id={id}
              ref={marcarPrimero(i)}
              value={valor}
              onChange={(e) => onCambio?.(c.id, e.target.value)}
              readOnly={soloLectura}
              inputMode={c.teclado ?? "text"}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder={c.pista}
              aria-describedby={r ? `${id}-nota` : undefined}
              aria-invalid={r && r.estado !== "correcto" ? true : undefined}
            />
            {nota}
          </div>
        );
      })}
    </div>
  );
}
