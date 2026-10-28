import { crearAzar } from "./azar";
import { tipoAbreviar, type DatosAbreviar } from "./abreviar6";
import { tipoSubred, type EjercicioBasico } from "./basico";
import { tipoBinario, type DatosBinario } from "./binario";
import type { Correccion, DefinicionTipo, Dificultad, Enunciado, CampoDef } from "./ejercicio";
import { tipoEUI64, type DatosEUI64 } from "./eui64";
import { tipoHosts, type DatosHosts } from "./hosts";
import { tipoMisma, type DatosMisma } from "./misma";
import { tipoPrefijo6, type DatosPrefijo6 } from "./prefijo6";
import { tipoWildcard, type DatosWildcard } from "./wildcard";

/** Registro de los tipos de ejercicio y las mezclas entre ellos. */

export type TipoEjercicio =
  | "subred"
  | "hosts"
  | "misma"
  | "wildcard"
  | "binario"
  | "abreviar6"
  | "prefijo6"
  | "eui64";

/** "mixto" es la mezcla IPv4: conserva ese nombre para que los enlaces antiguos sigan funcionando. */
export type Mezcla = "mixto" | "mixto-ipv6" | "mixto-todo";
export type Seleccion = TipoEjercicio | Mezcla;

export const TIPOS_IPV4: TipoEjercicio[] = ["subred", "hosts", "misma", "wildcard", "binario"];
export const TIPOS_IPV6: TipoEjercicio[] = ["abreviar6", "prefijo6", "eui64"];
export const TIPOS: TipoEjercicio[] = [...TIPOS_IPV4, ...TIPOS_IPV6];
export const MEZCLAS: Mezcla[] = ["mixto", "mixto-ipv6", "mixto-todo"];
export const SELECCIONES: Seleccion[] = [...TIPOS, ...MEZCLAS];

const TIPOS_DE_MEZCLA: Record<Mezcla, TipoEjercicio[]> = {
  mixto: TIPOS_IPV4,
  "mixto-ipv6": TIPOS_IPV6,
  "mixto-todo": TIPOS,
};

const NOMBRE_MEZCLA: Record<Mezcla, string> = {
  mixto: "Mixto IPv4",
  "mixto-ipv6": "Mixto IPv6",
  "mixto-todo": "Mixto: todo",
};

export function esMezcla(s: Seleccion): s is Mezcla {
  return (MEZCLAS as string[]).includes(s);
}

export function tiposDe(s: Seleccion): TipoEjercicio[] {
  return esMezcla(s) ? TIPOS_DE_MEZCLA[s] : [s];
}

export type Ejercicio =
  | { tipo: "subred"; semilla: string; dificultad: Dificultad; datos: EjercicioBasico }
  | { tipo: "hosts"; semilla: string; dificultad: Dificultad; datos: DatosHosts }
  | { tipo: "misma"; semilla: string; dificultad: Dificultad; datos: DatosMisma }
  | { tipo: "wildcard"; semilla: string; dificultad: Dificultad; datos: DatosWildcard }
  | { tipo: "binario"; semilla: string; dificultad: Dificultad; datos: DatosBinario }
  | { tipo: "abreviar6"; semilla: string; dificultad: Dificultad; datos: DatosAbreviar }
  | { tipo: "prefijo6"; semilla: string; dificultad: Dificultad; datos: DatosPrefijo6 }
  | { tipo: "eui64"; semilla: string; dificultad: Dificultad; datos: DatosEUI64 };

const DEFINICIONES: Record<TipoEjercicio, DefinicionTipo<never>> = {
  subred: tipoSubred as DefinicionTipo<never>,
  hosts: tipoHosts as DefinicionTipo<never>,
  misma: tipoMisma as DefinicionTipo<never>,
  wildcard: tipoWildcard as DefinicionTipo<never>,
  binario: tipoBinario as DefinicionTipo<never>,
  abreviar6: tipoAbreviar as DefinicionTipo<never>,
  prefijo6: tipoPrefijo6 as DefinicionTipo<never>,
  eui64: tipoEUI64 as DefinicionTipo<never>,
};

export function nombreSeleccion(s: Seleccion): string {
  return esMezcla(s) ? NOMBRE_MEZCLA[s] : DEFINICIONES[s].nombre;
}

export function descripcionSeleccion(s: Seleccion, dificultad: Dificultad): string {
  if (!esMezcla(s)) return DEFINICIONES[s].descripcion[dificultad];
  return s === "mixto-ipv6"
    ? "Un ejercicio IPv6 al azar cada vez"
    : s === "mixto-todo"
      ? "Un ejercicio IPv4 o IPv6 al azar cada vez"
      : "Un ejercicio IPv4 al azar cada vez";
}

export function esSeleccion(valor: unknown): valor is Seleccion {
  return typeof valor === "string" && (SELECCIONES as string[]).includes(valor);
}

/** En modo mixto el tipo también sale de la semilla, para que el enlace siga sirviendo. */
export function tipoPara(seleccion: Seleccion, semilla: string): TipoEjercicio {
  if (!esMezcla(seleccion)) return seleccion;
  // Mixto IPv4 usa la misma semilla que antes, para que los enlaces viejos den el mismo ejercicio.
  const clave = seleccion === "mixto" ? `mixto:${semilla}` : `${seleccion}:${semilla}`;
  return crearAzar(clave).elegir(TIPOS_DE_MEZCLA[seleccion]);
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
