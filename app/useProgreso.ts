"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  META_DIARIA,
  PROGRESO_INICIAL,
  esProgresoValido,
  hoyLocal,
  registrarEjercicios,
  vistaProgreso,
  type Progreso,
} from "@/lib/progreso";
import { guardar, leer } from "./almacen";

const CLAVE = "progreso:v1";

/**
 * Racha y meta diaria guardadas en el navegador. Mientras no se lee el
 * almacenamiento (primer render), `listo` es false y la interfaz no muestra
 * números, para no parpadear.
 */
export function useProgreso() {
  const [progreso, setProgreso] = useState<Progreso>(PROGRESO_INICIAL);
  const [listo, setListo] = useState(false);
  const actual = useRef<Progreso>(PROGRESO_INICIAL);

  useEffect(() => {
    const guardado = leer<unknown>(CLAVE, PROGRESO_INICIAL);
    const inicial = esProgresoValido(guardado) ? guardado : PROGRESO_INICIAL;
    actual.current = inicial;
    setProgreso(inicial);
    setListo(true);
  }, []);

  /** Registra ejercicios y avisa si con esto se cumplió la meta del día. */
  const registrar = useCallback((cantidad = 1): { cumplioMeta: boolean } => {
    const hoy = hoyLocal();
    const antes = vistaProgreso(actual.current, hoy).hechosHoy;
    const nuevo = registrarEjercicios(actual.current, hoy, cantidad);
    actual.current = nuevo;
    setProgreso(nuevo);
    guardar(CLAVE, nuevo);
    return { cumplioMeta: antes < META_DIARIA && nuevo.hechosHoy >= META_DIARIA };
  }, []);

  return { listo, ...vistaProgreso(progreso, hoyLocal()), meta: META_DIARIA, registrar };
}
