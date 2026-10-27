/**
 * Números pseudoaleatorios reproducibles a partir de una semilla de texto.
 * La misma semilla genera siempre el mismo ejercicio, así se puede compartir
 * por URL.
 */

/** Hash FNV-1a de 32 bits: convierte la semilla de texto en un número. */
function hashTexto(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Generador mulberry32: rápido, simple y suficiente para ejercicios. */
function mulberry32(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Azar {
  /** Número en [0, 1). */
  siguiente(): number;
  /** Entero entre `min` y `max`, ambos incluidos. */
  entero(min: number, max: number): number;
  /** Un elemento al azar de la lista. */
  elegir<T>(lista: readonly T[]): T;
}

export function crearAzar(semilla: string): Azar {
  const siguiente = mulberry32(hashTexto(semilla));
  return {
    siguiente,
    entero(min, max) {
      return min + Math.floor(siguiente() * (max - min + 1));
    },
    elegir(lista) {
      if (lista.length === 0) throw new Error("No se puede elegir de una lista vacía.");
      return lista[Math.floor(siguiente() * lista.length)];
    },
  };
}

const ALFABETO = "abcdefghijkmnpqrstuvwxyz23456789"; // sin caracteres que se confunden (l, 1, o, 0)

/** Semilla nueva, corta y fácil de copiar: "k7m2qx". */
export function nuevaSemilla(largo = 6): string {
  let s = "";
  const valores = new Uint32Array(largo);
  globalThis.crypto.getRandomValues(valores);
  for (const v of valores) s += ALFABETO[v % ALFABETO.length];
  return s;
}

/** Acepta solo semillas razonables desde la URL. */
export function esSemillaValida(texto: string | null | undefined): texto is string {
  return typeof texto === "string" && /^[a-z0-9-]{1,32}$/i.test(texto);
}
