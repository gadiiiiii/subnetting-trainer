/**
 * Racha de días y meta diaria. Funciones puras: reciben la fecha de hoy
 * como "AAAA-MM-DD" (en la zona horaria del navegador) y devuelven el estado
 * nuevo, para poder probarlas sin depender del reloj.
 */

export const META_DIARIA = 10;

export interface Progreso {
  /** Último día en que se practicó. */
  ultimoDia: string | null;
  /** Días seguidos practicando, terminando en `ultimoDia`. */
  racha: number;
  /** Ejercicios hechos en `ultimoDia`. */
  hechosHoy: number;
}

export const PROGRESO_INICIAL: Progreso = { ultimoDia: null, racha: 0, hechosHoy: 0 };

function diasEntre(desde: string, hasta: string): number {
  const aUTC = (f: string) => {
    const [a, m, d] = f.split("-").map(Number);
    return Date.UTC(a, m - 1, d);
  };
  return Math.round((aUTC(hasta) - aUTC(desde)) / 86_400_000);
}

/** Suma `cantidad` ejercicios hechos hoy y actualiza la racha. */
export function registrarEjercicios(p: Progreso, hoy: string, cantidad = 1): Progreso {
  if (p.ultimoDia === hoy) return { ...p, hechosHoy: p.hechosHoy + cantidad };
  const seguido = p.ultimoDia !== null && diasEntre(p.ultimoDia, hoy) === 1;
  return { ultimoDia: hoy, racha: seguido ? p.racha + 1 : 1, hechosHoy: cantidad };
}

/** Lo que se muestra hoy: la racha sigue viva si se practicó hoy o ayer. */
export function vistaProgreso(p: Progreso, hoy: string): { racha: number; hechosHoy: number; metaCumplida: boolean } {
  if (p.ultimoDia === null) return { racha: 0, hechosHoy: 0, metaCumplida: false };
  const dias = diasEntre(p.ultimoDia, hoy);
  const hechosHoy = dias === 0 ? p.hechosHoy : 0;
  return {
    racha: dias <= 1 ? p.racha : 0,
    hechosHoy,
    metaCumplida: hechosHoy >= META_DIARIA,
  };
}

export function esProgresoValido(x: unknown): x is Progreso {
  if (typeof x !== "object" || x === null) return false;
  const p = x as Record<string, unknown>;
  return (
    (p.ultimoDia === null || (typeof p.ultimoDia === "string" && /^\d{4}-\d{2}-\d{2}$/.test(p.ultimoDia))) &&
    Number.isInteger(p.racha) &&
    (p.racha as number) >= 0 &&
    Number.isInteger(p.hechosHoy) &&
    (p.hechosHoy as number) >= 0
  );
}

/** Fecha local del navegador como "AAAA-MM-DD". */
export function hoyLocal(ahora: Date = new Date()): string {
  const a = ahora.getFullYear();
  const m = String(ahora.getMonth() + 1).padStart(2, "0");
  const d = String(ahora.getDate()).padStart(2, "0");
  return `${a}-${m}-${d}`;
}
