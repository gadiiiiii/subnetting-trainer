"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckIcon, TargetIcon, Trash2Icon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatearTiempo } from "@/lib/examen";
import { NOMBRE_DIFICULTAD } from "@/lib/ejercicio";
import { calendario, puntoDebil, resumirGeneral, resumirTipo, type ResumenTipo } from "@/lib/estadisticas";
import { hoyLocal } from "@/lib/progreso";
import { TIPOS_IPV4, TIPOS_IPV6, nombreSeleccion, type TipoEjercicio } from "@/lib/tipos";
import { cn } from "@/lib/utils";
import BarraSuperior from "../BarraSuperior";
import { useEstadisticas } from "../useEstadisticas";
import { useProgreso } from "../useProgreso";

const fmtFecha = new Intl.DateTimeFormat("es-CL", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
function fecha(f: string) {
  const [a, m, d] = f.split("-").map(Number);
  return fmtFecha.format(new Date(Date.UTC(a, m - 1, d))).replaceAll(".", "");
}

function enlacePractica(tipo: TipoEjercicio, r?: ResumenTipo) {
  return `/?t=${tipo}&n=${r?.ultimaDificultad ?? "facil"}`;
}

function Cifra({ etiqueta, valor, detalle }: { etiqueta: string; valor: string; detalle?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <dt className="text-sm text-muted-foreground">{etiqueta}</dt>
      <dd className="mt-0.5 font-mono text-2xl font-bold">
        {valor}
        {detalle && <span className="ml-1 font-sans text-sm font-normal text-muted-foreground">{detalle}</span>}
      </dd>
    </div>
  );
}

/** Barra horizontal de un porcentaje, con el número escrito al lado. */
function Barra({ valor, etiqueta, detalle }: { valor: number; etiqueta: string; detalle: string }) {
  return (
    <div className="group relative flex items-center gap-3">
      <div
        className="h-2.5 flex-1 rounded-full bg-muted"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={valor}
        aria-label={etiqueta}
      >
        <div className="relative h-full rounded-full bg-red" style={{ width: `${Math.max(valor, 2)}%` }}>
          {/* Tooltip anclado al final de la barra. */}
          <span
            role="tooltip"
            className="pointer-events-none absolute right-0 bottom-full z-10 mb-2 hidden translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-xs font-semibold whitespace-nowrap text-background group-hover:block"
          >
            {detalle}
          </span>
        </div>
      </div>
      <span className="w-11 text-right font-mono text-sm font-bold tabular-nums">{valor}%</span>
    </div>
  );
}

function Ultimos({ ultimos }: { ultimos: (0 | 1)[] }) {
  if (ultimos.length === 0) return null;
  const bien = ultimos.filter((u) => u === 1).length;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Últimos {ultimos.length}:</span>
      <span className="flex gap-0.5" role="img" aria-label={`${bien} de los últimos ${ultimos.length} sin errores`}>
        {ultimos.map((u, i) => (
          <span
            key={i}
            className={cn(
              "grid size-4 place-items-center rounded-[3px]",
              u ? "bg-success text-white dark:text-background" : "border border-destructive/60 text-destructive",
            )}
          >
            {u ? <CheckIcon className="size-3" strokeWidth={3} /> : <XIcon className="size-3" strokeWidth={3} />}
          </span>
        ))}
      </span>
    </div>
  );
}

function TarjetaTipo({ tipo, resumen }: { tipo: TipoEjercicio; resumen?: ResumenTipo }) {
  const nombre = nombreSeleccion(tipo);
  if (!resumen || resumen.intentos === 0) {
    return (
      <li className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border px-4 py-3">
        <span>
          <span className="font-semibold">{nombre}</span>
          <span className="block text-sm text-muted-foreground">Todavía no practicas este tipo.</span>
        </span>
        <Link href={enlacePractica(tipo)} className="shrink-0 font-semibold text-primary underline-offset-4 hover:underline">
          Probar
        </Link>
      </li>
    );
  }
  return (
    <li className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="font-semibold">{nombre}</h4>
        <Link
          href={enlacePractica(tipo, resumen)}
          className="shrink-0 text-sm font-semibold text-primary underline-offset-4 hover:underline"
          aria-label={`Practicar ${nombre}`}
        >
          Practicar
        </Link>
      </div>
      <div className="mt-2">
        {resumen.precision === null ? (
          <p className="text-sm text-muted-foreground">Solo viste soluciones: aún no hay respuestas para medir.</p>
        ) : (
          <Barra
            valor={resumen.precision}
            etiqueta={`Respuestas correctas en ${nombre}`}
            detalle={`${resumen.respuestas.correctas} de ${resumen.respuestas.total} respuestas correctas`}
          />
        )}
      </div>
      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>
          <strong className="font-mono text-foreground">{resumen.intentos}</strong> {resumen.intentos === 1 ? "ejercicio" : "ejercicios"}
        </span>
        {resumen.tasaPerfectos !== null && (
          <span>
            <strong className="font-mono text-foreground">{resumen.tasaPerfectos}%</strong> sin errores
          </span>
        )}
        {resumen.segundosPromedio !== null && (
          <span>
            <strong className="font-mono text-foreground">{formatearTiempo(resumen.segundosPromedio)}</strong> por ejercicio
          </span>
        )}
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        {resumen.campoDebil ? (
          <p className="text-sm">
            Donde más fallas: <strong>{resumen.campoDebil.etiqueta}</strong>{" "}
            <span className="text-muted-foreground">({resumen.campoDebil.precision}% correctas)</span>
          </p>
        ) : (
          <span />
        )}
        <Ultimos ultimos={resumen.ultimos} />
      </div>
    </li>
  );
}

const NIVEL = ["bg-muted", "bg-calor-1", "bg-calor-2", "bg-calor-3"];
const nivel = (n: number) => (n === 0 ? 0 : n < 5 ? 1 : n < 10 ? 2 : 3);
const INICIAL_DIA = ["L", "", "X", "", "V", "", "D"];

function Calendario({ semanas }: { semanas: ReturnType<typeof calendario> }) {
  const dias = semanas.flat().filter((d) => !d.futuro);
  const practicados = dias.filter((d) => d.cantidad > 0);
  return (
    <div>
      <p className="text-sm text-muted-foreground">
        {practicados.length} {practicados.length === 1 ? "día" : "días"} con práctica en las últimas {semanas.length} semanas.
      </p>
      <div className="mt-3 flex gap-[3px] sm:gap-1" aria-hidden="true">
        <div className="grid grid-rows-7 gap-[3px] pr-1 text-[0.6875rem] leading-4 text-muted-foreground sm:gap-1 sm:leading-6">
          {INICIAL_DIA.map((d, i) => (
            <span key={i} className="h-4 sm:h-6">
              {d}
            </span>
          ))}
        </div>
        {semanas.map((semana, s) => (
          <div key={s} className="grid grid-rows-7 gap-[3px] sm:gap-1">
            {semana.map((d) => (
              <span
                key={d.fecha}
                className={cn("group relative size-4 rounded-[3px] sm:size-6 sm:rounded-[4px]", d.futuro ? "bg-transparent" : NIVEL[nivel(d.cantidad)])}
              >
                {!d.futuro && (
                  <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-xs font-semibold whitespace-nowrap text-background group-hover:block">
                    {fecha(d.fecha)}: {d.cantidad} {d.cantidad === 1 ? "ejercicio" : "ejercicios"}
                  </span>
                )}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground" aria-hidden="true">
        Menos
        {NIVEL.map((c) => (
          <span key={c} className={cn("size-3 rounded-[3px]", c)} />
        ))}
        Más (10 o más es la meta del día)
      </div>
      {/* Vista en texto para lectores de pantalla. */}
      <ul className="sr-only">
        {practicados.map((d) => (
          <li key={d.fecha}>
            {fecha(d.fecha)}: {d.cantidad} {d.cantidad === 1 ? "ejercicio" : "ejercicios"}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Progreso() {
  const { estadisticas, listo, borrar } = useEstadisticas();
  const progreso = useProgreso();
  const [confirmando, setConfirmando] = useState(false);

  const general = resumirGeneral(estadisticas);
  const debil = puntoDebil(estadisticas);
  const resumenDe = (t: TipoEjercicio) => {
    const e = estadisticas.porTipo[t];
    return e ? resumirTipo(e) : undefined;
  };

  return (
    <div className="min-h-dvh">
      <BarraSuperior actual="progreso" racha={progreso.listo ? progreso.racha : null} />
      <main className="mx-auto max-w-[44rem] px-4 pt-6 pb-16">
        <h1 className="titulo text-3xl font-extrabold">Tu progreso</h1>
        <p className="mt-1 text-muted-foreground">
          Se guarda en este navegador: no se envía a ningún servidor ni aparece en otros equipos.
        </p>

        {listo && general.ejercicios === 0 && (
          <section className="mt-8 rounded-lg border border-border bg-card p-6 text-center">
            <p className="text-lg font-semibold">Todavía no hay ejercicios registrados.</p>
            <p className="mt-1 text-muted-foreground">
              Cada ejercicio que revises en práctica o en un examen se suma aquí, por tipo.
            </p>
            <Button asChild className="mt-4">
              <Link href="/">Empezar a practicar</Link>
            </Button>
          </section>
        )}

        {listo && general.ejercicios > 0 && (
          <>
            <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Cifra etiqueta="Ejercicios" valor={String(general.ejercicios)} />
              <Cifra etiqueta="Respuestas correctas" valor={general.precision === null ? "–" : `${general.precision}%`} />
              <Cifra etiqueta="Días practicados" valor={String(general.diasPracticados)} />
              <Cifra
                etiqueta="Racha"
                valor={String(progreso.racha)}
                detalle={progreso.racha === 1 ? "día" : "días"}
              />
            </dl>

            {debil && (
              <section
                aria-labelledby="titulo-debil"
                className="mt-6 flex flex-col gap-4 rounded-lg border border-l-4 border-border border-l-red bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h2 id="titulo-debil" className="flex items-center gap-2 font-bold">
                    <TargetIcon className="size-5 text-red" aria-hidden="true" />
                    Lo que más te conviene practicar
                  </h2>
                  <p className="mt-1">
                    <strong>{nombreSeleccion(debil.tipo)}</strong>: {debil.resumen.precision}% de respuestas correctas
                    {debil.resumen.campoDebil && (
                      <>
                        . Donde más fallas: <strong>{debil.resumen.campoDebil.etiqueta}</strong>
                      </>
                    )}
                    .
                  </p>
                </div>
                <Button asChild className="shrink-0">
                  <Link href={enlacePractica(debil.tipo, debil.resumen)}>
                    Practicar en {NOMBRE_DIFICULTAD[debil.resumen.ultimaDificultad].toLowerCase()}
                  </Link>
                </Button>
              </section>
            )}

            <section aria-labelledby="titulo-tipos" className="mt-10">
              <h2 id="titulo-tipos" className="titulo text-2xl font-extrabold">
                Por tipo de ejercicio
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                La barra es el porcentaje de respuestas correctas, campo por campo.
              </p>
              {(
                [
                  ["IPv4", TIPOS_IPV4],
                  ["IPv6", TIPOS_IPV6],
                ] as const
              ).map(([familia, tipos]) => (
                <div key={familia} className="mt-5">
                  <h3 className="text-sm font-semibold text-muted-foreground">{familia}</h3>
                  <ul className="mt-2 space-y-2">
                    {tipos.map((t) => (
                      <TarjetaTipo key={t} tipo={t} resumen={resumenDe(t)} />
                    ))}
                  </ul>
                </div>
              ))}
            </section>

            <section aria-labelledby="titulo-dias" className="mt-10">
              <h2 id="titulo-dias" className="titulo text-2xl font-extrabold">
                Días de práctica
              </h2>
              <div className="mt-3 rounded-lg border border-border bg-card p-4">
                <Calendario semanas={calendario(estadisticas, hoyLocal())} />
              </div>
            </section>

            <section className="mt-12 border-t border-border pt-5">
              {confirmando ? (
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-semibold">¿Borrar todo tu progreso de este navegador? No se puede deshacer.</p>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      borrar();
                      setConfirmando(false);
                    }}
                  >
                    Sí, borrar
                  </Button>
                  <Button variant="outline" onClick={() => setConfirmando(false)}>
                    Cancelar
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" className="px-0 text-destructive" onClick={() => setConfirmando(true)}>
                  <Trash2Icon /> Borrar mi progreso
                </Button>
              )}
              <p className="mt-1 text-sm text-muted-foreground">
                Borra las estadísticas por tipo y el calendario. La racha y la meta del día se mantienen.
              </p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
