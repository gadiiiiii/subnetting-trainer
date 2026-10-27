"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { nuevaSemilla } from "@/lib/azar";
import {
  CAMPOS,
  DIFICULTADES,
  ETIQUETAS,
  contarCorrectas,
  corregirBasico,
  explicarBasico,
  generarBasico,
  type Campo,
  type Correccion,
  type Dificultad,
  type Respuestas,
} from "@/lib/basico";
import { formatearIPv4 } from "@/lib/ipv4";
import Explicacion from "./Explicacion";

const VACIAS: Respuestas = { mascara: "", red: "", broadcast: "", primerHost: "", ultimoHost: "", hosts: "" };

const PISTAS: Record<Campo, string> = {
  mascara: "255.255.255.0",
  red: "0.0.0.0",
  broadcast: "0.0.0.0",
  primerHost: "0.0.0.0",
  ultimoHost: "0.0.0.0",
  hosts: "0",
};

type Estado = "respondiendo" | "revisado" | "solucion";

export default function Entrenador({
  semillaInicial,
  dificultadInicial,
}: {
  semillaInicial: string;
  dificultadInicial: Dificultad;
}) {
  const [semilla, setSemilla] = useState(semillaInicial);
  const [dificultad, setDificultad] = useState(dificultadInicial);
  const [respuestas, setRespuestas] = useState<Respuestas>(VACIAS);
  const [estado, setEstado] = useState<Estado>("respondiendo");
  const [correccion, setCorreccion] = useState<Correccion | null>(null);
  const [sesion, setSesion] = useState({ resueltos: 0, perfectos: 0 });
  const [copiado, setCopiado] = useState(false);
  const primerCampo = useRef<HTMLInputElement>(null);
  const siguiente = useRef<HTMLButtonElement>(null);

  const ejercicio = useMemo(() => generarBasico(semilla, dificultad), [semilla, dificultad]);
  const explicacion = useMemo(() => explicarBasico(ejercicio), [ejercicio]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("n", dificultad);
    url.searchParams.set("s", semilla);
    window.history.replaceState(null, "", url);
  }, [semilla, dificultad]);

  function nuevoEjercicio(nueva: Dificultad = dificultad) {
    setDificultad(nueva);
    setSemilla(nuevaSemilla());
    setRespuestas(VACIAS);
    setCorreccion(null);
    setEstado("respondiendo");
    setCopiado(false);
    requestAnimationFrame(() => primerCampo.current?.focus());
  }

  function revisar(e: React.FormEvent) {
    e.preventDefault();
    if (estado !== "respondiendo") {
      nuevoEjercicio();
      return;
    }
    const c = corregirBasico(ejercicio, respuestas);
    setCorreccion(c);
    setEstado("revisado");
    setSesion((s) => ({ resueltos: s.resueltos + 1, perfectos: s.perfectos + (contarCorrectas(c) === CAMPOS.length ? 1 : 0) }));
    requestAnimationFrame(() => siguiente.current?.focus());
  }

  function verSolucion() {
    setCorreccion(corregirBasico(ejercicio, {}));
    setEstado("solucion");
    setSesion((s) => ({ ...s, resueltos: s.resueltos + 1 }));
    requestAnimationFrame(() => siguiente.current?.focus());
  }

  async function copiarEnlace() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  }

  const correctas = correccion ? contarCorrectas(correccion) : 0;
  const terminado = estado !== "respondiendo";

  return (
    <main>
      <header className="cabecera">
        <p className="marca">Entrenador de subnetting</p>
        <div className="dificultad" role="radiogroup" aria-label="Dificultad">
          {(Object.keys(DIFICULTADES) as Dificultad[]).map((d) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={dificultad === d}
              title={DIFICULTADES[d].descripcion}
              onClick={() => d !== dificultad && nuevoEjercicio(d)}
            >
              {DIFICULTADES[d].nombre}
            </button>
          ))}
        </div>
      </header>

      <section className="enunciado" aria-labelledby="titulo-ejercicio">
        <h1 id="titulo-ejercicio">
          <span className="enunciado-texto">Calcula la subred de</span>
          <span className="direccion">
            {formatearIPv4(ejercicio.ip)}
            <span className="prefijo">/{ejercicio.prefijo}</span>
          </span>
        </h1>
        <p className="enunciado-meta">
          {DIFICULTADES[dificultad].descripcion}.{" "}
          {sesion.resueltos > 0 &&
            `En esta sesión: ${sesion.perfectos} de ${sesion.resueltos} ${sesion.resueltos === 1 ? "ejercicio" : "ejercicios"} sin errores.`}
        </p>
      </section>

      <form className="respuestas" onSubmit={revisar} noValidate>
        <div className="campos">
          {CAMPOS.map((campo, i) => {
            const r = correccion?.[campo];
            const clase = r && estado === "revisado" ? `campo campo-${r.estado}` : "campo";
            return (
              <div key={campo} className={clase}>
                <label htmlFor={campo}>{ETIQUETAS[campo]}</label>
                <input
                  id={campo}
                  ref={i === 0 ? primerCampo : undefined}
                  value={estado === "solucion" ? r!.esperado : respuestas[campo]}
                  onChange={(e) => setRespuestas({ ...respuestas, [campo]: e.target.value })}
                  readOnly={terminado}
                  inputMode={campo === "mascara" ? "text" : "decimal"}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  placeholder={PISTAS[campo]}
                  aria-describedby={r ? `${campo}-nota` : undefined}
                  aria-invalid={estado === "revisado" && r && r.estado !== "correcto" ? true : undefined}
                />
                {r && estado === "revisado" && (
                  <p id={`${campo}-nota`} className="nota">
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
                )}
              </div>
            );
          })}
        </div>

        {terminado && (
          <div
            className={`resumen ${estado === "revisado" && correctas === CAMPOS.length ? "resumen-perfecto" : ""}`}
            role="status"
          >
            {estado === "solucion"
              ? "Esta es la solución. Revisa la explicación y prueba con el siguiente."
              : correctas === CAMPOS.length
                ? "Todo correcto."
                : `${correctas} de ${CAMPOS.length} correctas. Revisa la explicación para ver dónde estuvo el error.`}
          </div>
        )}

        <div className="acciones">
          {terminado ? (
            <button ref={siguiente} type="submit" className="primario">
              Siguiente ejercicio
            </button>
          ) : (
            <>
              <button type="submit" className="primario">
                Revisar
              </button>
              <button type="button" className="secundario" onClick={verSolucion}>
                Ver solución
              </button>
            </>
          )}
          <button type="button" className="enlace" onClick={copiarEnlace}>
            {copiado ? "Enlace copiado" : "Copiar enlace a este ejercicio"}
          </button>
        </div>
      </form>

      {terminado && <Explicacion datos={explicacion} />}

      <footer className="pie">
        <p>
          Cada ejercicio sale de una semilla que queda en la dirección de la página: si compartes el
          enlace, la otra persona ve el mismo ejercicio. Puedes escribir la máscara como{" "}
          <code>255.255.255.224</code> o <code>/27</code>.
        </p>
      </footer>
    </main>
  );
}
