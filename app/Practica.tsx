"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Link2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import BarraSuperior from "./BarraSuperior";
import Explicacion from "./explicaciones/Explicacion";
import Franja, { type TonoFranja } from "./Franja";
import MetaDiaria from "./MetaDiaria";
import Reloj from "./Reloj";
import Respuestas from "./Respuestas";
import SelectorEjercicio from "./SelectorEjercicio";
import TarjetaPregunta from "./TarjetaPregunta";
import { useProgreso } from "./useProgreso";

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
  const primerCampo = useRef<HTMLElement | null>(null);
  const continuar = useRef<HTMLButtonElement>(null);
  const progreso = useProgreso();

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
    window.scrollTo({ top: 0 });
    requestAnimationFrame(() => primerCampo.current?.focus());
  }

  function registrar() {
    if (progreso.registrar().cumplioMeta) toast.success(`Cumpliste la meta de hoy: ${progreso.meta} ejercicios.`);
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (terminado) return nuevoEjercicio();
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
    registrar();
    requestAnimationFrame(() => continuar.current?.focus());
  }

  function verSolucion() {
    setCorreccion(null);
    setEstado("solucion");
    setFin(Date.now());
    setSesion((s) => ({ ...s, resueltos: s.resueltos + 1 }));
    requestAnimationFrame(() => continuar.current?.focus());
  }

  function alternarCronometro(activo: boolean) {
    setCronometro(activo);
    guardar("cronometro", activo);
  }

  async function copiarEnlace() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast("Enlace copiado: quien lo abra verá este mismo ejercicio.");
    } catch {
      toast.error("No se pudo copiar. Copia la dirección de la barra del navegador.");
    }
  }

  // ── Franja inferior ──
  const correctas = correccion ? contarCorrectas(correccion) : 0;
  const total = defs.length;
  const perfecto = estado === "revisado" && correctas === total;
  const segundosEjercicio = inicio && fin ? Math.round((fin - inicio) / 1000) : null;

  let tono: TonoFranja = "neutro";
  let mensaje: string | undefined;
  let detalle: string | undefined;
  if (estado === "solucion") {
    tono = "solucion";
    mensaje = "Esta es la solución";
    detalle = "Revisa cómo se resuelve y prueba con el siguiente.";
  } else if (estado === "revisado") {
    tono = perfecto ? "correcto" : "incorrecto";
    mensaje = perfecto ? (total === 1 ? "Correcto" : "Todo correcto") : `${correctas} de ${total} correctas`;
    const partes = [];
    if (cronometro && segundosEjercicio !== null) partes.push(`Lo resolviste en ${formatearTiempo(segundosEjercicio)}.`);
    if (!perfecto) partes.push("La explicación está más abajo.");
    detalle = partes.join(" ") || undefined;
  }

  const lineaSesion =
    sesion.resueltos > 0
      ? `En esta sesión: ${sesion.perfectos} de ${sesion.resueltos} sin errores` +
        (sesion.cronometrados > 0 ? `, ${formatearTiempo(sesion.segundos / sesion.cronometrados)} en promedio.` : ".")
      : null;

  return (
    <div className="min-h-dvh">
      <BarraSuperior actual="practica" racha={progreso.listo ? progreso.racha : null} />

      <main className="mx-auto max-w-[44rem] px-4 pt-5 pb-48 sm:pb-36">
        <MetaDiaria hechos={progreso.hechosHoy} meta={progreso.meta} listo={progreso.listo} />

        <div className="mt-5">
          <SelectorEjercicio
            seleccion={seleccion}
            dificultad={dificultad}
            onSeleccion={(s) => nuevoEjercicio({ seleccion: s })}
            onDificultad={(d) => nuevoEjercicio({ dificultad: d })}
          >
            <div className="flex items-center gap-2">
              <Switch id="cronometro" checked={cronometro} onCheckedChange={alternarCronometro} />
              <Label htmlFor="cronometro">Cronómetro</Label>
            </div>
          </SelectorEjercicio>
          <p className="mt-2 text-sm text-muted-foreground">
            {descripcionSeleccion(seleccion, dificultad)}.{lineaSesion && ` ${lineaSesion}`}
          </p>
        </div>

        <div className="mt-6">
          <TarjetaPregunta
            tipo={seleccion === "mixto" ? `Mixto: ${nombreSeleccion(ejercicio.tipo)}` : nombreSeleccion(seleccion)}
            enunciado={enunciado(ejercicio)}
            extra={
              <>
                {cronometro && inicio && <Reloj desde={inicio} hasta={fin} etiqueta="Tiempo en este ejercicio" />}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={copiarEnlace}
                  aria-label="Copiar enlace a este ejercicio"
                  title="Copiar enlace a este ejercicio"
                  className="size-11 text-muted-foreground hover:text-primary"
                >
                  <Link2Icon className="size-5" />
                </Button>
              </>
            }
          />
        </div>

        <form id="form-ejercicio" className="mt-6" onSubmit={enviar} noValidate>
          <Respuestas
            key={`${ejercicio.tipo}-${semilla}`}
            campos={defs}
            valores={estado === "solucion" ? solucion(ejercicio) : respuestas}
            onCambio={(id, v) => setRespuestas((r) => ({ ...r, [id]: v }))}
            correccion={estado === "revisado" ? correccion : null}
            soloLectura={terminado}
            primerCampo={primerCampo}
          />
        </form>

        {terminado && (
          <Explicacion key={`${ejercicio.tipo}-${semilla}`} ejercicio={ejercicio} abierta={!perfecto} />
        )}

        <p className="mt-12 border-t border-border pt-4 text-sm text-muted-foreground">
          Cada ejercicio sale de una semilla que queda en la dirección de la página: si compartes el enlace, la otra
          persona ve el mismo ejercicio. La máscara se puede escribir como <code className="font-mono">255.255.255.224</code>{" "}
          o <code className="font-mono">/27</code>.
        </p>

      <Franja
        tono={tono}
        mensaje={mensaje}
        detalle={detalle}
        acciones={
          terminado ? (
            <Button
              key="continuar"
              ref={continuar}
              type="submit"
              form="form-ejercicio"
              size="lg"
              variant={tono === "correcto" ? "success" : "default"}
            >
              Continuar
            </Button>
          ) : (
            <>
              <Button key="solucion" type="button" variant="outline" size="lg" onClick={verSolucion}>
                Ver solución
              </Button>
              <Button key="revisar" type="submit" form="form-ejercicio" size="lg">
                Revisar
              </Button>
            </>
          )
        }
      />
      </main>
    </div>
  );
}
