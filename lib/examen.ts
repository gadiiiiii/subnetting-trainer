import { contarCorrectas, totalCampos, type Correccion, type Dificultad } from "./ejercicio";
import { crearAzar } from "./azar";
import { esMezcla, generarDeTipo, generarEjercicio, tiposDe, type Ejercicio, type Seleccion } from "./tipos";

/**
 * Modo examen: una serie fija de ejercicios con cronómetro. La serie sale de
 * una semilla, así que el mismo enlace da el mismo examen a todos.
 */

export const PREGUNTAS_EXAMEN = 10;

/**
 * En las mezclas, los tipos se reparten lo más parejo posible (con 10
 * preguntas y 5 tipos, dos de cada uno) y se barajan, para que el examen no
 * quede cargado a un solo tipo.
 */
export function generarExamen(
  seleccion: Seleccion,
  dificultad: Dificultad,
  semilla: string,
  cantidad = PREGUNTAS_EXAMEN,
): Ejercicio[] {
  const semillaDe = (i: number) => `${semilla}-${i + 1}`;
  if (!esMezcla(seleccion)) {
    return Array.from({ length: cantidad }, (_, i) => generarEjercicio(seleccion, semillaDe(i), dificultad));
  }
  const azar = crearAzar(`examen:${semilla}`);
  const barajar = <T,>(lista: T[]) => {
    for (let i = lista.length - 1; i > 0; i--) {
      const j = azar.entero(0, i);
      [lista[i], lista[j]] = [lista[j], lista[i]];
    }
    return lista;
  };
  // Primero se baraja el orden de los tipos, para que los que se repiten de más no sean siempre los mismos.
  const base = seleccion === "mixto" ? [...tiposDe(seleccion)] : barajar([...tiposDe(seleccion)]);
  const tipos = barajar(Array.from({ length: cantidad }, (_, i) => base[i % base.length]));
  return tipos.map((tipo, i) => generarDeTipo(tipo, semillaDe(i), dificultad));
}

export interface RespuestaExamen {
  correccion: Correccion;
  /** Segundos que tomó responder este ejercicio. */
  segundos: number;
}

export interface ResumenExamen {
  camposCorrectos: number;
  camposTotales: number;
  /** Ejercicios con todos los campos correctos. */
  perfectos: number;
  ejercicios: number;
  segundosTotales: number;
  segundosPromedio: number;
  /** Porcentaje de campos correctos, redondeado. */
  porcentaje: number;
}

export function resumirExamen(respuestas: RespuestaExamen[]): ResumenExamen {
  let camposCorrectos = 0;
  let camposTotales = 0;
  let perfectos = 0;
  let segundosTotales = 0;
  for (const r of respuestas) {
    const correctas = contarCorrectas(r.correccion);
    const total = totalCampos(r.correccion);
    camposCorrectos += correctas;
    camposTotales += total;
    if (correctas === total) perfectos++;
    segundosTotales += r.segundos;
  }
  return {
    camposCorrectos,
    camposTotales,
    perfectos,
    ejercicios: respuestas.length,
    segundosTotales,
    segundosPromedio: respuestas.length ? Math.round(segundosTotales / respuestas.length) : 0,
    porcentaje: camposTotales ? Math.round((camposCorrectos / camposTotales) * 100) : 0,
  };
}

/** ¿Es este resultado mejor que el anterior? Primero gana el porcentaje, después el tiempo. */
export function esMejor(nuevo: ResumenExamen, anterior: { porcentaje: number; segundosTotales: number } | null) {
  if (!anterior) return true;
  if (nuevo.porcentaje !== anterior.porcentaje) return nuevo.porcentaje > anterior.porcentaje;
  return nuevo.segundosTotales < anterior.segundosTotales;
}

/** 65 → "1:05"; 3725 → "1:02:05". */
export function formatearTiempo(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}
