import { contarCorrectas, totalCampos, type Correccion, type Dificultad } from "./ejercicio";
import type { TipoEjercicio } from "./tipos";

/**
 * Progreso por tipo de ejercicio: cuántos se hicieron, qué porcentaje de
 * respuestas fue correcto, en qué campo se falla más y los días practicados.
 * Funciones puras: reciben el estado y devuelven el nuevo.
 */

export const ULTIMOS = 10;
const DIAS_GUARDADOS = 400;

export interface EstadisticaCampo {
  etiqueta: string;
  correctos: number;
  total: number;
}

export interface EstadisticaTipo {
  intentos: number;
  /** Ejercicios con todos los campos correctos. */
  perfectos: number;
  camposCorrectos: number;
  camposTotales: number;
  porCampo: Record<string, EstadisticaCampo>;
  /** Suma de segundos de los ejercicios cronometrados. */
  segundos: number;
  cronometrados: number;
  /** Veces que se vio la solución sin responder. */
  soluciones: number;
  /** Últimos resultados, el más reciente al final: 1 = sin errores. */
  ultimos: (0 | 1)[];
  ultimaDificultad: Dificultad;
}

export interface Estadisticas {
  version: 1;
  porTipo: Partial<Record<TipoEjercicio, EstadisticaTipo>>;
  /** Ejercicios hechos por día ("AAAA-MM-DD"). */
  porDia: Record<string, number>;
}

export const ESTADISTICAS_VACIAS: Estadisticas = { version: 1, porTipo: {}, porDia: {} };

function tipoVacio(dificultad: Dificultad): EstadisticaTipo {
  return {
    intentos: 0,
    perfectos: 0,
    camposCorrectos: 0,
    camposTotales: 0,
    porCampo: {},
    segundos: 0,
    cronometrados: 0,
    soluciones: 0,
    ultimos: [],
    ultimaDificultad: dificultad,
  };
}

function sumarDia(porDia: Record<string, number>, hoy: string, cantidad = 1): Record<string, number> {
  const nuevo = { ...porDia, [hoy]: (porDia[hoy] ?? 0) + cantidad };
  const dias = Object.keys(nuevo).sort();
  for (const d of dias.slice(0, Math.max(0, dias.length - DIAS_GUARDADOS))) delete nuevo[d];
  return nuevo;
}

function agregarUltimo(lista: (0 | 1)[], valor: 0 | 1): (0 | 1)[] {
  return [...lista, valor].slice(-ULTIMOS);
}

export interface Intento {
  tipo: TipoEjercicio;
  dificultad: Dificultad;
  correccion: Correccion;
  /** Etiqueta visible de cada campo, para mostrar dónde se falla. */
  etiquetas: Record<string, string>;
  /** null si no se midió el tiempo. */
  segundos: number | null;
}

export function registrarIntento(est: Estadisticas, intento: Intento, hoy: string): Estadisticas {
  const previo = est.porTipo[intento.tipo] ?? tipoVacio(intento.dificultad);
  const correctas = contarCorrectas(intento.correccion);
  const total = totalCampos(intento.correccion);

  const porCampo = { ...previo.porCampo };
  for (const [id, r] of Object.entries(intento.correccion)) {
    const c = porCampo[id] ?? { etiqueta: intento.etiquetas[id] ?? id, correctos: 0, total: 0 };
    porCampo[id] = {
      etiqueta: intento.etiquetas[id] ?? c.etiqueta,
      correctos: c.correctos + (r.estado === "correcto" ? 1 : 0),
      total: c.total + 1,
    };
  }

  const perfecto = correctas === total;
  return {
    ...est,
    porTipo: {
      ...est.porTipo,
      [intento.tipo]: {
        ...previo,
        intentos: previo.intentos + 1,
        perfectos: previo.perfectos + (perfecto ? 1 : 0),
        camposCorrectos: previo.camposCorrectos + correctas,
        camposTotales: previo.camposTotales + total,
        porCampo,
        segundos: previo.segundos + (intento.segundos ?? 0),
        cronometrados: previo.cronometrados + (intento.segundos === null ? 0 : 1),
        ultimos: agregarUltimo(previo.ultimos, perfecto ? 1 : 0),
        ultimaDificultad: intento.dificultad,
      },
    },
    porDia: sumarDia(est.porDia, hoy),
  };
}

/** Ver la solución cuenta como un ejercicio no resuelto, pero no suma al porcentaje de respuestas. */
export function registrarSolucionVista(est: Estadisticas, tipo: TipoEjercicio, dificultad: Dificultad, hoy: string): Estadisticas {
  const previo = est.porTipo[tipo] ?? tipoVacio(dificultad);
  return {
    ...est,
    porTipo: {
      ...est.porTipo,
      [tipo]: {
        ...previo,
        intentos: previo.intentos + 1,
        soluciones: previo.soluciones + 1,
        ultimos: agregarUltimo(previo.ultimos, 0),
        ultimaDificultad: dificultad,
      },
    },
    porDia: sumarDia(est.porDia, hoy),
  };
}

export interface ResumenTipo {
  intentos: number;
  /** % de respuestas correctas (campo por campo). null si aún no hay respuestas. */
  precision: number | null;
  /** % de ejercicios sin errores. */
  tasaPerfectos: number | null;
  segundosPromedio: number | null;
  /** Respuestas correctas sobre el total, campo por campo. */
  respuestas: { correctas: number; total: number };
  /** El campo con menor porcentaje de acierto, si tiene al menos 3 respuestas y está bajo 90%. */
  campoDebil: { etiqueta: string; precision: number } | null;
  ultimos: (0 | 1)[];
  ultimaDificultad: Dificultad;
}

const porcentaje = (a: number, b: number) => (b ? Math.round((a / b) * 100) : null);

export function resumirTipo(e: EstadisticaTipo): ResumenTipo {
  let campoDebil: ResumenTipo["campoDebil"] = null;
  for (const c of Object.values(e.porCampo)) {
    if (c.total < 3) continue;
    const p = Math.round((c.correctos / c.total) * 100);
    if (p < 90 && (!campoDebil || p < campoDebil.precision)) campoDebil = { etiqueta: c.etiqueta, precision: p };
  }
  return {
    intentos: e.intentos,
    precision: porcentaje(e.camposCorrectos, e.camposTotales),
    respuestas: { correctas: e.camposCorrectos, total: e.camposTotales },
    tasaPerfectos: porcentaje(e.perfectos, e.intentos),
    segundosPromedio: e.cronometrados ? Math.round(e.segundos / e.cronometrados) : null,
    campoDebil,
    ultimos: e.ultimos,
    ultimaDificultad: e.ultimaDificultad,
  };
}

export interface ResumenGeneral {
  ejercicios: number;
  precision: number | null;
  diasPracticados: number;
}

export function resumirGeneral(est: Estadisticas): ResumenGeneral {
  let ejercicios = 0;
  let correctos = 0;
  let totales = 0;
  for (const e of Object.values(est.porTipo)) {
    ejercicios += e.intentos;
    correctos += e.camposCorrectos;
    totales += e.camposTotales;
  }
  return {
    ejercicios,
    precision: porcentaje(correctos, totales),
    diasPracticados: Object.values(est.porDia).filter((n) => n > 0).length,
  };
}

/**
 * El tipo que más conviene practicar: el de menor porcentaje de respuestas
 * correctas entre los que tienen al menos 3 ejercicios y no superan el 90%.
 */
export function puntoDebil(est: Estadisticas): { tipo: TipoEjercicio; resumen: ResumenTipo } | null {
  let peor: { tipo: TipoEjercicio; resumen: ResumenTipo } | null = null;
  for (const [tipo, e] of Object.entries(est.porTipo) as [TipoEjercicio, EstadisticaTipo][]) {
    const r = resumirTipo(e);
    if (e.intentos < 3 || r.precision === null || r.precision >= 90) continue;
    if (!peor || r.precision < peor.resumen.precision!) peor = { tipo, resumen: r };
  }
  return peor;
}

function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split("-").map(Number);
  const x = new Date(Date.UTC(a, m - 1, d + dias));
  return x.toISOString().slice(0, 10);
}

/**
 * Las últimas `semanas` semanas, de lunes a domingo, terminando en la semana
 * de hoy. Los días futuros de esta semana vienen con `futuro: true`.
 */
export function calendario(est: Estadisticas, hoy: string, semanas = 12) {
  const [a, m, d] = hoy.split("-").map(Number);
  const diaSemana = (new Date(Date.UTC(a, m - 1, d)).getUTCDay() + 6) % 7; // lunes = 0
  const inicio = sumarDias(hoy, -diaSemana - (semanas - 1) * 7);
  return Array.from({ length: semanas }, (_, s) =>
    Array.from({ length: 7 }, (_, dia) => {
      const fecha = sumarDias(inicio, s * 7 + dia);
      return { fecha, cantidad: est.porDia[fecha] ?? 0, futuro: fecha > hoy };
    }),
  );
}

export function esEstadisticasValidas(x: unknown): x is Estadisticas {
  if (typeof x !== "object" || x === null) return false;
  const e = x as Record<string, unknown>;
  return (
    e.version === 1 &&
    typeof e.porTipo === "object" &&
    e.porTipo !== null &&
    typeof e.porDia === "object" &&
    e.porDia !== null &&
    Object.values(e.porTipo as object).every(
      (t) => typeof t === "object" && t !== null && Number.isInteger((t as EstadisticaTipo).intentos) && Array.isArray((t as EstadisticaTipo).ultimos),
    )
  );
}
