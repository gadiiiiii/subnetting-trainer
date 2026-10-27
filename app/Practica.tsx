"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { nuevaSemilla } from "@/lib/azar";
import { contarCorrectas, totalCampos, type Correccion, type Dificultad } from "@/lib/ejercicio";
import { formatearTiempo } from "@/lib/examen";
import {
  campos,
  corregir,
  descripcionSeleccion,
  enunciado,
  generarEjercicio,
  nombreSeleccion,
  solucion,
  type Seleccion,
} from "@/lib/tipos";
import { guardar, leer } from "./almacen";
import Configuracion from "./Configuracion";
import EnunciadoVista from "./EnunciadoVista";
import Explicacion from "./explicaciones/Explicacion";
import Navegacion from "./Navegacion";
import Reloj from "./Reloj";
import Respuestas from "./Respuestas";

type Estado = "respondiendo" | "revisado" | "solucion";

export default function Practica({
  seleccionInicial,
  dificultadInicial,
  semillaInicial,
}: {
  seleccionInicial: Seleccion;
  dificultadInicial: Dificultad;
  semillaInicial: string;
}) {
  const [seleccion, setSeleccion] = useState(seleccionInicial);
  const [dificultad, setDificultad] = useState(dificultadInicial);
  const [semilla, setSemilla] = useState(semillaInicial);
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [estado, setEstado] = useState<Estado>("respondiendo");
  const [correccion, setCorreccion] = useState<Correccion | null>(null);
  const [sesion, setSesion] = useState({ resueltos: 0, perfectos: 0, segundos: 0, cronometrados: 0 });
  const [cronometro, setCronometro] = useState(false);
  const [inicio, setInicio] = useState<number | null>(null);
  const [fin, setFin] = useState<number | null>(null);
  const [copiado, setCopiado] = useState(false);
  const primerCampo = useRef<HTMLElement | null>(null);
  const siguiente = useRef<HTMLButtonElement>(null);

  const ejercicio = useMemo(() => generarEjercicio(seleccion, semilla, dificultad), [seleccion, semilla, dificultad]);
  const defs = campos(ejercicio);
  const terminado = estado !== "respondiendo";

  useEffect(() => setCronometro(leer("cronometro", false)), []);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("t", seleccion);
    url.searchParams.set("n", dificultad);
    url.searchParams.set("s", semilla);
    window.history.replaceState(null, "", url);
  }, [seleccion, dificultad, semilla]);

  // El reloj parte cada vez que aparece un ejercicio nuevo.
  useEffect(() => {
    setInicio(Date.now());
    setFin(null);
  }, [ejercicio]);

  function nuevoEjercicio(cambio: { seleccion?: Seleccion; dificultad?: Dificultad } = {}) {
    if (cambio.seleccion) setSeleccion(cambio.seleccion);
    if (cambio.dificultad) setDificultad(cambio.dificultad);
    setSemilla(nuevaSemilla());
    setRespuestas({});
    setCorreccion(null);
    setEstado("respondiendo");
    setCopiado(false);
    requestAnimationFrame(() => primerCampo.current?.focus());
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (terminado) {
      nuevoEjercicio();
      return;
    }
    const ahora = Date.now();
    const c = corregir(ejercicio, respuestas);
    setCorreccion(c);
    setEstado("revisado");
    setFin(ahora);
    const segundos = inicio ? Math.round((ahora - inicio) / 1000) : 0;
    setSesion((s) => ({
      resueltos: s.resueltos + 1,
      perfectos: s.perfectos + (contarCorrectas(c) === totalCampos(c) ? 1 : 0),
      segundos: s.segundos + (cronometro ? segundos : 0),
      cronometrados: s.cronometrados + (cronometro ? 1 : 0),
    }));
    requestAnimationFrame(() => siguiente.current?.focus());
  }

  function verSolucion() {
    setCorreccion(null);
    setEstado("solucion");
    setFin(Date.now());
    setSesion((s) => ({ ...s, resueltos: s.resueltos + 1 }));
    requestAnimationFrame(() => siguiente.current?.focus());
  }

  function alternarCronometro(activo: boolean) {
    setCronometro(activo);
    guardar("cronometro", activo);
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
  const total = defs.length;
  const segundosEjercicio = inicio && fin ? Math.round((fin - inicio) / 1000) : null;

  let resumen = "";
  if (estado === "solucion") resumen = "Esta es la solución. Revisa la explicación y prueba con el siguiente.";
  else if (estado === "revisado")
    resumen =
      correctas === total
        ? total === 1
          ? "Correcto."
          : "Todo correcto."
        : `${correctas} de ${total} correctas. Revisa la explicación para ver dónde estuvo el error.`;
  if (estado === "revisado" && cronometro && segundosEjercicio !== null)
    resumen += ` Lo resolviste en ${formatearTiempo(segundosEjercicio)}.`;

  const lineaSesion =
    sesion.resueltos > 0
      ? `En esta sesión: ${sesion.perfectos} de ${sesion.resueltos} ${sesion.resueltos === 1 ? "ejercicio" : "ejercicios"} sin errores` +
        (sesion.cronometrados > 0
          ? `, ${formatearTiempo(sesion.segundos / sesion.cronometrados)} en promedio.`
          : ".")
      : "";

  return (
    <main>
      <Navegacion actual="practica" />

      <Configuracion
        seleccion={seleccion}
        dificultad={dificultad}
        onSeleccion={(s) => nuevoEjercicio({ seleccion: s })}
        onDificultad={(d) => nuevoEjercicio({ dificultad: d })}
      >
        <label className="interruptor">
          <input type="checkbox" checked={cronometro} onChange={(e) => alternarCronometro(e.target.checked)} />
          <span>Cronómetro</span>
        </label>
      </Configuracion>

      <section className="enunciado" aria-labelledby="titulo-ejercicio">
        <div className="enunciado-cabecera">
          <p className="enunciado-tipo">
            {seleccion === "mixto" ? `Mixto: ${nombreSeleccion(ejercicio.tipo)}` : nombreSeleccion(seleccion)}
          </p>
          {cronometro && inicio && <Reloj desde={inicio} hasta={fin} etiqueta="Tiempo en este ejercicio" />}
        </div>
        <EnunciadoVista enunciado={enunciado(ejercicio)} id="titulo-ejercicio" />
        <p className="enunciado-meta">
          {descripcionSeleccion(seleccion, dificultad)}. {lineaSesion}
        </p>
      </section>

      <form className="respuestas" onSubmit={enviar} noValidate>
        <Respuestas
          key={`${ejercicio.tipo}-${semilla}`}
          campos={defs}
          valores={estado === "solucion" ? solucion(ejercicio) : respuestas}
          onCambio={(id, v) => setRespuestas((r) => ({ ...r, [id]: v }))}
          correccion={estado === "revisado" ? correccion : null}
          soloLectura={terminado}
          primerCampo={primerCampo}
        />

        {terminado && (
          <div
            className={`resumen ${estado === "revisado" && correctas === total ? "resumen-perfecto" : ""}`}
            role="status"
          >
            {resumen}
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

      {terminado && <Explicacion ejercicio={ejercicio} />}

      <footer className="pie">
        <p>
          Cada ejercicio sale de una semilla que queda en la dirección de la página: si compartes el
          enlace, la otra persona ve el mismo ejercicio. La máscara se puede escribir como{" "}
          <code>255.255.255.224</code> o <code>/27</code>.
        </p>
      </footer>
    </main>
  );
}
