import { crearAzar } from "./azar";
import { tipoSubred, type EjercicioBasico } from "./basico";
import { tipoBinario, type DatosBinario } from "./binario";
import type { Correccion, DefinicionTipo, Dificultad, Enunciado, CampoDef } from "./ejercicio";
import { tipoHosts, type DatosHosts } from "./hosts";
import { tipoMisma, type DatosMisma } from "./misma";
import { tipoWildcard, type DatosWildcard } from "./wildcard";

/** Registro de los tipos de ejercicio y la mezcla entre ellos. */

export type TipoEjercicio = "subred" | "hosts" | "misma" | "wildcard" | "binario";
export type Seleccion = TipoEjercicio | "mixto";

export const TIPOS: TipoEjercicio[] = ["subred", "hosts", "misma", "wildcard", "binario"];
export const SELECCIONES: Seleccion[] = [...TIPOS, "mixto"];

export type Ejercicio =
  | { tipo: "subred"; semilla: string; dificultad: Dificultad; datos: EjercicioBasico }
  | { tipo: "hosts"; semilla: string; dificultad: Dificultad; datos: DatosHosts }
  | { tipo: "misma"; semilla: string; dificultad: Dificultad; datos: DatosMisma }
  | { tipo: "wildcard"; semilla: string; dificultad: Dificultad; datos: DatosWildcard }
  | { tipo: "binario"; semilla: string; dificultad: Dificultad; datos: DatosBinario };

const DEFINICIONES: Record<TipoEjercicio, DefinicionTipo<never>> = {
  subred: tipoSubred as DefinicionTipo<never>,
  hosts: tipoHosts as DefinicionTipo<never>,
  misma: tipoMisma as DefinicionTipo<never>,
  wildcard: tipoWildcard as DefinicionTipo<never>,
  binario: tipoBinario as DefinicionTipo<never>,
};

export function nombreSeleccion(s: Seleccion): string {
  return s === "mixto" ? "Mixto" : DEFINICIONES[s].nombre;
}

export function descripcionSeleccion(s: Seleccion, dificultad: Dificultad): string {
  return s === "mixto"
    ? "Un tipo de ejercicio al azar cada vez"
    : DEFINICIONES[s].descripcion[dificultad];
}

export function esSeleccion(valor: unknown): valor is Seleccion {
  return typeof valor === "string" && (SELECCIONES as string[]).includes(valor);
}

/** En modo mixto el tipo también sale de la semilla, para que el enlace siga sirviendo. */
export function tipoPara(seleccion: Seleccion, semilla: string): TipoEjercicio {
  return seleccion === "mixto" ? crearAzar(`mixto:${semilla}`).elegir(TIPOS) : seleccion;
}

export function generarEjercicio(seleccion: Seleccion, semilla: string, dificultad: Dificultad): Ejercicio {
  return generarDeTipo(tipoPara(seleccion, semilla), semilla, dificultad);
}

export function generarDeTipo(tipo: TipoEjercicio, semilla: string, dificultad: Dificultad): Ejercicio {
  const datos = DEFINICIONES[tipo].generar(semilla, dificultad);
  return { tipo, semilla, dificultad, datos } as Ejercicio;
}

function def(e: Ejercicio): DefinicionTipo<unknown> {
  return DEFINICIONES[e.tipo] as DefinicionTipo<unknown>;
}

export const enunciado = (e: Ejercicio): Enunciado => def(e).enunciado(e.datos);
export const campos = (e: Ejercicio): CampoDef[] => def(e).campos(e.datos);
export const corregir = (e: Ejercicio, r: Record<string, string>): Correccion => def(e).corregir(e.datos, r);

/** Solución solo de los campos que pide este ejercicio, en el mismo orden. */
export function solucion(e: Ejercicio): Record<string, string> {
  const todo = def(e).solucion(e.datos);
  return Object.fromEntries(campos(e).map((c) => [c.id, todo[c.id]]));
}
