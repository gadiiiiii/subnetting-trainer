"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Dificultad } from "@/lib/ejercicio";
import {
  ESTADISTICAS_VACIAS,
  esEstadisticasValidas,
  registrarIntento,
  registrarSolucionVista,
  type Estadisticas,
  type Intento,
} from "@/lib/estadisticas";
import { hoyLocal } from "@/lib/progreso";
import type { TipoEjercicio } from "@/lib/tipos";
import { guardar, leer } from "./almacen";

const CLAVE = "estadisticas:v1";

/** Progreso por tipo de ejercicio, guardado en el navegador. */
export function useEstadisticas() {
  const [estadisticas, setEstadisticas] = useState<Estadisticas>(ESTADISTICAS_VACIAS);
  const [listo, setListo] = useState(false);
  const actual = useRef<Estadisticas>(ESTADISTICAS_VACIAS);

  useEffect(() => {
    const guardado = leer<unknown>(CLAVE, ESTADISTICAS_VACIAS);
    const inicial = esEstadisticasValidas(guardado) ? guardado : ESTADISTICAS_VACIAS;
    actual.current = inicial;
    setEstadisticas(inicial);
    setListo(true);
  }, []);

  const aplicar = useCallback((cambio: (e: Estadisticas) => Estadisticas) => {
    const nuevo = cambio(actual.current);
    actual.current = nuevo;
    setEstadisticas(nuevo);
    guardar(CLAVE, nuevo);
  }, []);

  const intento = useCallback(
    (i: Intento | Intento[]) => {
      const hoy = hoyLocal();
      aplicar((e) => (Array.isArray(i) ? i : [i]).reduce((acc, x) => registrarIntento(acc, x, hoy), e));
    },
    [aplicar],
  );

  const solucionVista = useCallback(
    (tipo: TipoEjercicio, dificultad: Dificultad) => aplicar((e) => registrarSolucionVista(e, tipo, dificultad, hoyLocal())),
    [aplicar],
  );

  const borrar = useCallback(() => aplicar(() => ESTADISTICAS_VACIAS), [aplicar]);

  return { estadisticas, listo, intento, solucionVista, borrar };
}
