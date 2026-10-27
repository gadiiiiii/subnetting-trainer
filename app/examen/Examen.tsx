"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Link2Icon, RotateCcwIcon, TrophyIcon } from "lucide-react";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
import { campos, corregir, descripcionSeleccion, enunciado, nombreSeleccion, type Seleccion } from "@/lib/tipos";
import { cn } from "@/lib/utils";
import { guardar, leer } from "../almacen";
import BarraSuperior from "../BarraSuperior";
import { PasosDe } from "../explicaciones/Explicacion";
import { NivelPasos } from "../explicaciones/Paso";
import Franja from "../Franja";
import Reloj from "../Reloj";
import Respuestas from "../Respuestas";
import SelectorEjercicio from "../SelectorEjercicio";
import TarjetaPregunta from "../TarjetaPregunta";
import { useProgreso } from "../useProgreso";

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
  const primerCampo = useRef<HTMLElement | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const progreso = useProgreso();

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
    window.scrollTo({ top: 0 });
    requestAnimationFrame(() => primerCampo.current?.focus());
  }

  function responder(e: React.FormEvent) {
    e.preventDefault();
    const ahora = Date.now();
    const contestado: Contestado = {
      correccion: corregir(ejercicios[indice], valores),
      segundos: Math.round((ahora - inicioEjercicio) / 1000),
      valores,
    };
    const todos = [...contestados, contestado];
    setContestados(todos);
    setValores({});

    if (indice + 1 < ejercicios.length) {
      setIndice(indice + 1);
      setInicioEjercicio(ahora);
      window.scrollTo({ top: 0 });
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
    if (progreso.registrar(todos.length).cumplioMeta) {
      toast.success(`Cumpliste la meta de hoy: ${progreso.meta} ejercicios.`);
    }
    window.scrollTo({ top: 0 });
    requestAnimationFrame(() => titulo.current?.focus());
  }

  function otroExamen() {
    setSemilla(nuevaSemilla());
    setFase("inicio");
  }

  async function copiarEnlace() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast("Enlace copiado: quien lo abra recibirá este mismo examen.");
    } catch {
      toast.error("No se pudo copiar. Copia la dirección de la barra del navegador.");
    }
  }

  const botonCopiar = (
    <Button type="button" variant="ghost" onClick={copiarEnlace} className="px-0">
      <Link2Icon /> Copiar enlace al examen
    </Button>
  );

  const barra = <BarraSuperior actual="examen" racha={progreso.listo ? progreso.racha : null} />;

  // ── Portada ──
  if (fase === "inicio") {
    return (
      <div className="min-h-dvh">
        {barra}
        <main className="mx-auto max-w-[44rem] px-4 pt-6 pb-48 sm:pb-36">
          <SelectorEjercicio
            seleccion={seleccion}
            dificultad={dificultad}
            onSeleccion={(s) => cambiarConfiguracion({ seleccion: s })}
            onDificultad={(d) => cambiarConfiguracion({ dificultad: d })}
          />

          <section
            aria-labelledby="titulo-examen"
            className="mt-6 rounded-lg border border-border bg-card p-5 shadow-sm sm:p-7"
          >
            <p className="text-sm font-semibold text-red">Examen</p>
            <h1 id="titulo-examen" className="mt-1 font-mono text-[clamp(2rem,7vw,3rem)] leading-tight font-bold">
              {PREGUNTAS_EXAMEN} ejercicios
            </h1>
            <p className="mt-2 text-muted-foreground">
              {nombreSeleccion(seleccion)}, dificultad {NOMBRE_DIFICULTAD[dificultad].toLowerCase()}:{" "}
              {seleccion === "mixto"
                ? "dos ejercicios de cada tipo, en orden aleatorio"
                : descripcionSeleccion(seleccion, dificultad).toLowerCase()}
              .
            </p>
            <ul className="mt-5 list-disc space-y-1.5 pl-5">
              <li>El reloj parte cuando presionas Empezar.</li>
              <li>Respondes y pasas al siguiente: las correcciones y explicaciones aparecen al final.</li>
              <li>
                Este examen tiene el código <code className="rounded-sm bg-muted px-1 font-mono font-semibold">{semilla}</code>.
                Con el mismo enlace, todos reciben los mismos {PREGUNTAS_EXAMEN} ejercicios: sirve para competir o para
                una clase.
              </li>
            </ul>
            {record && (
              <p className="mt-5 flex items-center gap-2 font-semibold">
                <TrophyIcon className="size-5 text-red" aria-hidden="true" />
                Tu mejor resultado aquí: {record.porcentaje}% en {formatearTiempo(record.segundosTotales)}.
              </p>
            )}
            <div className="mt-4">{botonCopiar}</div>
          </section>
        <Franja
          tono="neutro"
          acciones={
            <>
              <Button key="otro" type="button" variant="outline" size="lg" onClick={otroExamen}>
                <RotateCcwIcon /> Otro examen
              </Button>
              <Button key="empezar" type="button" size="lg" onClick={empezar}>
                Empezar examen
              </Button>
            </>
          }
        />
        </main>
      </div>
    );
  }

  // ── Rindiendo ──
  if (fase === "rindiendo") {
    const ejercicio = ejercicios[indice];
    const ultimo = indice === ejercicios.length - 1;
    return (
      <div className="min-h-dvh">
        {barra}
        <main className="mx-auto max-w-[44rem] px-4 pt-5 pb-48 sm:pb-36">
          <div className="flex items-center gap-3">
            <Progress
              value={(indice / ejercicios.length) * 100}
              aria-label="Avance del examen"
              aria-valuetext={`Ejercicio ${indice + 1} de ${ejercicios.length}`}
              className="h-2.5"
            />
            <p className="shrink-0 text-sm font-semibold text-muted-foreground tabular-nums">
              {indice + 1} de {ejercicios.length}
            </p>
          </div>

          <div className="mt-6">
            <TarjetaPregunta
              tipo={nombreSeleccion(ejercicio.tipo)}
              enunciado={enunciado(ejercicio)}
              extra={<Reloj desde={inicioExamen} etiqueta="Tiempo del examen" />}
            />
          </div>

          <form id="form-examen" className="mt-6" onSubmit={responder} noValidate>
            <Respuestas
              key={indice}
              campos={campos(ejercicio)}
              valores={valores}
              onCambio={(id, v) => setValores((r) => ({ ...r, [id]: v }))}
              primerCampo={primerCampo}
            />
          </form>
        <Franja
          tono="neutro"
          mensaje={undefined}
          acciones={
            <>
              <p key="ayuda" className="hidden self-center text-sm text-muted-foreground sm:block">
                Si no sabes uno, déjalo en blanco y sigue.
              </p>
              <Button key="siguiente" type="submit" form="form-examen" size="lg">
                {ultimo ? "Terminar examen" : "Siguiente"}
              </Button>
            </>
          }
        />
        </main>
      </div>
    );
  }

  // ── Resultados ──
  const resumen = resumirExamen(contestados);
  const segundosTotales = finExamen ? (finExamen - inicioExamen) / 1000 : resumen.segundosTotales;
  return (
    <div className="min-h-dvh">
      {barra}
      <main className="mx-auto max-w-[44rem] px-4 pt-6 pb-48 sm:pb-36">
        <section aria-labelledby="titulo-resultado" className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-7">
          <p className="text-sm font-semibold text-red">Resultado</p>
          <h1
            id="titulo-resultado"
            ref={titulo}
            tabIndex={-1}
            className="mt-1 font-mono text-[clamp(2rem,7vw,3rem)] leading-tight font-bold outline-none"
          >
            {resumen.perfectos} de {resumen.ejercicios}
            <span className="block font-sans text-lg font-semibold text-muted-foreground">ejercicios sin errores</span>
          </h1>
          <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-muted-foreground">Respuestas correctas</dt>
              <dd className="font-mono text-2xl font-bold">
                {resumen.porcentaje}%{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  ({resumen.camposCorrectos}/{resumen.camposTotales})
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Tiempo total</dt>
              <dd className="font-mono text-2xl font-bold">{formatearTiempo(segundosTotales)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Por ejercicio</dt>
              <dd className="font-mono text-2xl font-bold">{formatearTiempo(resumen.segundosPromedio)}</dd>
            </div>
          </dl>
          {marca === "record" && (
            <p className="mt-5 inline-flex items-center gap-2 rounded-md bg-success-soft px-3 py-1.5 font-semibold text-success">
              <TrophyIcon className="size-5" aria-hidden="true" /> Nuevo récord con esta configuración.
            </p>
          )}
          {marca === "primera" && (
            <p className="mt-5 text-muted-foreground">
              Es tu primer examen con esta configuración: quedó guardado como tu récord.
            </p>
          )}
          {marca === null && record && (
            <p className="mt-5 flex items-center gap-2 text-muted-foreground">
              <TrophyIcon className="size-5 text-red" aria-hidden="true" />
              Tu mejor resultado aquí: {record.porcentaje}% en {formatearTiempo(record.segundosTotales)}.
            </p>
          )}
          <div className="mt-4">{botonCopiar}</div>
        </section>

        <section aria-labelledby="titulo-revision" className="mt-10">
          <h2 id="titulo-revision" className="titulo text-2xl font-extrabold">
            Revisión, ejercicio por ejercicio
          </h2>
          <Accordion type="multiple" className="mt-4 space-y-2">
            {ejercicios.map((e, i) => {
              const c = contestados[i];
              if (!c) return null;
              const correctas = contarCorrectas(c.correccion);
              const total = totalCampos(c.correccion);
              const ok = correctas === total;
              const en = enunciado(e);
              return (
                <AccordionItem
                  key={i}
                  value={`e${i}`}
                  className={cn("rounded-lg border border-l-4 border-border bg-card px-4", ok ? "border-l-success" : "border-l-destructive")}
                >
                  <AccordionTrigger className="gap-3 py-3 font-normal hover:text-foreground">
                    <span className="grid flex-1 grid-cols-[1.5rem_1fr_auto] items-baseline gap-x-3 gap-y-0.5 sm:grid-cols-[1.5rem_1fr_auto_auto]">
                      <span className="font-bold text-muted-foreground">{i + 1}</span>
                      <span className="min-w-0">
                        <span className="text-sm text-muted-foreground">{en.pregunta} </span>
                        <span className="font-mono font-semibold [overflow-wrap:anywhere]">
                          {en.lineas.map((l) => `${l.valor}${l.acento ?? ""}`).join(" y ")}
                        </span>
                      </span>
                      <span className={cn("font-mono font-bold", ok ? "text-success" : "text-destructive")}>
                        {correctas}/{total}
                      </span>
                      <span className="col-start-2 font-mono text-sm text-muted-foreground sm:col-start-auto">
                        {formatearTiempo(c.segundos)}
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="border-t border-border pt-4">
                    <Respuestas campos={campos(e)} valores={c.valores} correccion={c.correccion} soloLectura prefijoId={`e${i}-`} />
                    <h4 className="titulo mt-8 border-t border-dashed border-border pt-5 text-lg font-extrabold">
                      Cómo se resuelve
                    </h4>
                    <NivelPasos.Provider value={5}>
                      <PasosDe ejercicio={e} />
                    </NivelPasos.Provider>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </section>
      <Franja
        tono={resumen.perfectos === resumen.ejercicios ? "correcto" : "neutro"}
        mensaje={resumen.perfectos === resumen.ejercicios ? "Examen perfecto" : undefined}
        acciones={
          <>
            <Button key="otro-fin" type="button" variant="outline" size="lg" onClick={otroExamen}>
              Otro examen
            </Button>
            <Button key="repetir" type="button" size="lg" onClick={empezar}>
              <RotateCcwIcon /> Repetir este examen
            </Button>
          </>
        }
      />
      </main>
    </div>
  );
}
