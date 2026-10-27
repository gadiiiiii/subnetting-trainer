"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { nuevaSemilla } from "@/lib/azar";
import { NOMBRE_DIFICULTAD, contarCorrectas, totalCampos, type Dificultad } from "@/lib/ejercicio";
import {
  PREGUNTAS_EXAMEN,
  esMejor,
  formatearTiempo,
  generarExamen,
  resumirExamen,
  type RespuestaExamen,
} from "@/lib/examen";
import {
  campos,
  corregir,
  descripcionSeleccion,
  enunciado,
  nombreSeleccion,
  type Seleccion,
} from "@/lib/tipos";
import { guardar, leer } from "../almacen";
import Configuracion from "../Configuracion";
import EnunciadoVista from "../EnunciadoVista";
import Explicacion from "../explicaciones/Explicacion";
import Navegacion from "../Navegacion";
import Reloj from "../Reloj";
import Respuestas from "../Respuestas";

type Fase = "inicio" | "rindiendo" | "fin";

interface RecordExamen {
  porcentaje: number;
  segundosTotales: number;
}

interface Contestado extends RespuestaExamen {
  valores: { [id: string]: string };
}

export default function Examen({
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
  const [fase, setFase] = useState<Fase>("inicio");
  const [indice, setIndice] = useState(0);
  const [valores, setValores] = useState<{ [id: string]: string }>({});
  const [contestados, setContestados] = useState<Contestado[]>([]);
  const [inicioExamen, setInicioExamen] = useState(0);
  const [finExamen, setFinExamen] = useState<number | null>(null);
  const [inicioEjercicio, setInicioEjercicio] = useState(0);
  const [record, setRecord] = useState<RecordExamen | null>(null);
  const [marca, setMarca] = useState<"primera" | "record" | null>(null);
  const [copiado, setCopiado] = useState(false);
  const primerCampo = useRef<HTMLElement | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);

  const ejercicios = useMemo(() => generarExamen(seleccion, dificultad, semilla), [seleccion, dificultad, semilla]);
  const claveRecord = `record:${seleccion}:${dificultad}`;

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("t", seleccion);
    url.searchParams.set("n", dificultad);
    url.searchParams.set("s", semilla);
    window.history.replaceState(null, "", url);
  }, [seleccion, dificultad, semilla]);

  useEffect(() => setRecord(leer<RecordExamen | null>(claveRecord, null)), [claveRecord]);

  function cambiarConfiguracion(cambio: { seleccion?: Seleccion; dificultad?: Dificultad }) {
    if (cambio.seleccion) setSeleccion(cambio.seleccion);
    if (cambio.dificultad) setDificultad(cambio.dificultad);
    setSemilla(nuevaSemilla());
    setCopiado(false);
  }

  function empezar() {
    const ahora = Date.now();
    setFase("rindiendo");
    setIndice(0);
    setValores({});
    setContestados([]);
    setInicioExamen(ahora);
    setFinExamen(null);
    setInicioEjercicio(ahora);
    setMarca(null);
    requestAnimationFrame(() => primerCampo.current?.focus());
  }

  function responder(e: React.FormEvent) {
    e.preventDefault();
    const ahora = Date.now();
    const ejercicio = ejercicios[indice];
    const contestado: Contestado = {
      correccion: corregir(ejercicio, valores),
      segundos: Math.round((ahora - inicioEjercicio) / 1000),
      valores,
    };
    const todos = [...contestados, contestado];
    setContestados(todos);
    setValores({});

    if (indice + 1 < ejercicios.length) {
      setIndice(indice + 1);
      setInicioEjercicio(ahora);
      requestAnimationFrame(() => primerCampo.current?.focus());
      return;
    }

    setFinExamen(ahora);
    setFase("fin");
    const resumen = resumirExamen(todos);
    if (esMejor(resumen, record)) {
      const nuevo = { porcentaje: resumen.porcentaje, segundosTotales: resumen.segundosTotales };
      setMarca(record === null ? "primera" : "record");
      setRecord(nuevo);
      guardar(claveRecord, nuevo);
    }
    requestAnimationFrame(() => titulo.current?.focus());
  }

  function otroExamen() {
    setSemilla(nuevaSemilla());
    setFase("inicio");
    setCopiado(false);
  }

  async function copiarEnlace() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  }

  const botonCopiar = (
    <button type="button" className="enlace" onClick={copiarEnlace}>
      {copiado ? "Enlace copiado" : "Copiar enlace a este examen"}
    </button>
  );

  // ── Antes de empezar ──
  if (fase === "inicio") {
    return (
      <main>
        <Navegacion actual="examen" />
        <Configuracion
          seleccion={seleccion}
          dificultad={dificultad}
          onSeleccion={(s) => cambiarConfiguracion({ seleccion: s })}
          onDificultad={(d) => cambiarConfiguracion({ dificultad: d })}
        />
        <section className="portada-examen" aria-labelledby="titulo-examen">
          <h1 id="titulo-examen">
            <span className="enunciado-texto">Examen</span>
            <span className="direccion">
              {PREGUNTAS_EXAMEN} ejercicios<span className="prefijo"> contra el reloj</span>
            </span>
          </h1>
          <p className="portada-detalle">
            {nombreSeleccion(seleccion)}, dificultad {NOMBRE_DIFICULTAD[dificultad].toLowerCase()}:{" "}
            {seleccion === "mixto"
              ? `dos ejercicios de cada tipo, en orden aleatorio`
              : descripcionSeleccion(seleccion, dificultad).toLowerCase()}
            .
          </p>
          <ul className="reglas">
            <li>El reloj parte cuando presionas Empezar.</li>
            <li>Respondes y pasas al siguiente: las correcciones y explicaciones aparecen al final.</li>
            <li>
              Este examen tiene el código <code>{semilla}</code>. Con el mismo enlace, todos reciben los
              mismos {PREGUNTAS_EXAMEN} ejercicios: sirve para competir o para una clase.
            </li>
          </ul>
          {record && (
            <p className="record">
              Tu mejor resultado con esta configuración: {record.porcentaje}% en{" "}
              {formatearTiempo(record.segundosTotales)}.
            </p>
          )}
          <div className="acciones">
            <button type="button" className="primario" onClick={empezar}>
              Empezar examen
            </button>
            <button type="button" className="secundario" onClick={otroExamen}>
              Generar otro examen
            </button>
            {botonCopiar}
          </div>
        </section>
      </main>
    );
  }

  // ── Rindiendo ──
  if (fase === "rindiendo") {
    const ejercicio = ejercicios[indice];
    const ultimo = indice === ejercicios.length - 1;
    return (
      <main>
        <Navegacion actual="examen" />
        <div className="barra-examen">
          <span className="progreso-texto">
            Ejercicio {indice + 1} de {ejercicios.length}
          </span>
          <Reloj desde={inicioExamen} etiqueta="Tiempo del examen" />
          <div
            className="progreso"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={ejercicios.length}
            aria-valuenow={indice}
            aria-label="Avance del examen"
          >
            <div className="progreso-relleno" style={{ width: `${(indice / ejercicios.length) * 100}%` }} />
          </div>
        </div>

        <section className="enunciado" aria-labelledby="titulo-ejercicio">
          {seleccion === "mixto" && <p className="enunciado-tipo">{nombreSeleccion(ejercicio.tipo)}</p>}
          <EnunciadoVista enunciado={enunciado(ejercicio)} id="titulo-ejercicio" />
        </section>

        <form className="respuestas" onSubmit={responder} noValidate>
          <Respuestas
            key={indice}
            campos={campos(ejercicio)}
            valores={valores}
            onCambio={(id, v) => setValores((r) => ({ ...r, [id]: v }))}
            primerCampo={primerCampo}
          />
          <div className="acciones">
            <button type="submit" className="primario">
              {ultimo ? "Terminar examen" : "Siguiente"}
            </button>
            <span className="ayuda-acciones">Si no sabes uno, déjalo en blanco y sigue.</span>
          </div>
        </form>
      </main>
    );
  }

  // ── Resultados ──
  const resumen = resumirExamen(contestados);
  return (
    <main>
      <Navegacion actual="examen" />
      <section className="resultado-examen" aria-labelledby="titulo-resultado">
        <h1 id="titulo-resultado" ref={titulo} tabIndex={-1}>
          <span className="enunciado-texto">Resultado</span>
          <span className="direccion">
            {resumen.perfectos} de {resumen.ejercicios}
            <span className="prefijo"> sin errores</span>
          </span>
        </h1>
        <dl className="cifras">
          <div>
            <dt>Respuestas correctas</dt>
            <dd>
              {resumen.porcentaje}%{" "}
              <span className="cifra-detalle">
                ({resumen.camposCorrectos} de {resumen.camposTotales})
              </span>
            </dd>
          </div>
          <div>
            <dt>Tiempo total</dt>
            <dd>{finExamen ? formatearTiempo((finExamen - inicioExamen) / 1000) : formatearTiempo(resumen.segundosTotales)}</dd>
          </div>
          <div>
            <dt>Promedio por ejercicio</dt>
            <dd>{formatearTiempo(resumen.segundosPromedio)}</dd>
          </div>
        </dl>
        {marca === "record" && <p className="record record-nuevo">Nuevo récord con esta configuración.</p>}
        {marca === "primera" && (
          <p className="record">Es tu primer examen con esta configuración: quedó guardado como tu récord.</p>
        )}
        {marca === null && record && (
          <p className="record">
            Tu mejor resultado con esta configuración: {record.porcentaje}% en{" "}
            {formatearTiempo(record.segundosTotales)}.
          </p>
        )}
        <div className="acciones">
          <button type="button" className="primario" onClick={empezar}>
            Repetir este examen
          </button>
          <button type="button" className="secundario" onClick={otroExamen}>
            Otro examen
          </button>
          {botonCopiar}
        </div>
      </section>

      <section className="revision" aria-labelledby="titulo-revision">
        <h2 id="titulo-revision">Revisión, ejercicio por ejercicio</h2>
        <ol className="lista-resultados">
          {ejercicios.map((e, i) => {
            const c = contestados[i];
            if (!c) return null;
            const correctas = contarCorrectas(c.correccion);
            const total = totalCampos(c.correccion);
            const en = enunciado(e);
            const perfecto = correctas === total;
            return (
              <li key={i} className={perfecto ? "resultado-ok" : "resultado-error"}>
                <details>
                  <summary>
                    <span className="resultado-numero">{i + 1}</span>
                    <span className="resultado-texto">
                      <span className="resultado-pregunta">{en.pregunta}</span>{" "}
                      <span className="resultado-valores">
                        {en.lineas.map((l) => `${l.valor}${l.acento ?? ""}`).join(" y ")}
                      </span>
                    </span>
                    <span className="resultado-puntaje">
                      {correctas}/{total}
                    </span>
                    <span className="resultado-tiempo">{formatearTiempo(c.segundos)}</span>
                  </summary>
                  <div className="resultado-detalle">
                    <Respuestas
                      campos={campos(e)}
                      valores={c.valores}
                      correccion={c.correccion}
                      soloLectura
                      prefijoId={`e${i}-`}
                    />
                    <Explicacion ejercicio={e} titulo="Cómo se resuelve" />
                  </div>
                </details>
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}
