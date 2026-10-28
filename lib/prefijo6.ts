import { crearAzar } from "./azar";
import { MENSAJES, corregirCampo, formatearHosts, parsearHosts, type Correccion, type DefinicionTipo, type Dificultad } from "./ejercicio";
import { abreviar, expandir, grupos, idInterfaz, red6, subredes64, type IPv6 } from "./ipv6";
import { corregirIPv6, direccionGlobal, formatearInterfaz, parsearInterfaz } from "./ipv6Comun";

/**
 * Prefijo de red IPv6: dada una dirección con su prefijo, encontrar la red.
 * Con /64 se pide además el ID de interfaz; con prefijos más cortos, cuántas
 * subredes /64 caben (lo típico al recibir un /48 de un proveedor).
 */

export interface DatosPrefijo6 {
  ip: IPv6;
  prefijo: number;
}

const NIBBLE = [32, 40, 44, 48, 52, 56, 60, 64];

export function generarPrefijo6(semilla: string, dificultad: Dificultad): DatosPrefijo6 {
  const azar = crearAzar(`prefijo6:${dificultad}:${semilla}`);
  const prefijo =
    dificultad === "facil" ? 64 : dificultad === "media" ? azar.elegir(NIBBLE) : azar.entero(33, 63);
  let ip = direccionGlobal(azar, dificultad === "facil");
  // Que la dirección no sea la red misma.
  if (ip === red6(ip, prefijo)) ip = ip | 1n;
  return { ip, prefijo };
}

export interface ExplicacionPrefijo6 {
  prefijo: number;
  completa: string;
  red: string;
  redCompleta: string;
  /** Grupos (0-7) que quedan enteros en la red. */
  gruposCompletos: number;
  /** Si el prefijo corta un dígito hexadecimal: el grupo, el dígito y los bits que quedan. */
  corte: { grupo: number; digito: number; bitsDeRed: number; valor: number; queda: number } | null;
  subredes: string | null;
  interfaz: string | null;
}

export function explicarPrefijo6(d: DatosPrefijo6): ExplicacionPrefijo6 {
  const red = red6(d.ip, d.prefijo);
  const resto = d.prefijo % 4;
  let corte: ExplicacionPrefijo6["corte"] = null;
  if (resto !== 0) {
    const grupo = Math.floor(d.prefijo / 16);
    const digito = Math.floor((d.prefijo % 16) / 4);
    const valor = (grupos(d.ip)[grupo] >> ((3 - digito) * 4)) & 0xf;
    const queda = valor & ((0xf << (4 - resto)) & 0xf);
    corte = { grupo, digito, bitsDeRed: resto, valor, queda };
  }
  return {
    prefijo: d.prefijo,
    completa: expandir(d.ip),
    red: `${abreviar(red)}/${d.prefijo}`,
    redCompleta: expandir(red),
    gruposCompletos: Math.floor(d.prefijo / 16),
    corte,
    subredes: d.prefijo < 64 ? formatearHosts(Number(subredes64(d.prefijo))) : null,
    interfaz: d.prefijo === 64 ? formatearInterfaz(idInterfaz(d.ip)) : null,
  };
}

export const tipoPrefijo6: DefinicionTipo<DatosPrefijo6> = {
  nombre: "IPv6: prefijo de red",
  descripcion: {
    facil: "Prefijos /64 en 2001:db8::",
    media: "Prefijos en límite de dígito: /48, /56, /64…",
    dificil: "Cualquier prefijo entre /33 y /63",
  },
  generar: generarPrefijo6,
  enunciado: (d) => ({
    pregunta: "Encuentra el prefijo de red de",
    lineas: [{ valor: abreviar(d.ip), acento: `/${d.prefijo}` }],
    nota:
      d.prefijo === 64
        ? "En una /64, los 64 bits de la izquierda son la red y los 64 de la derecha, el ID de interfaz."
        : `Cada grupo son 16 bits y cada dígito hexadecimal, 4. Con /${d.prefijo} se conservan los primeros ${d.prefijo} bits.`,
    compacto: true,
  }),
  campos: (d) => [
    { id: "red", etiqueta: "Prefijo de red", pista: "2001:db8:1::", entrada: "texto", teclado: "text" },
    d.prefijo === 64
      ? { id: "interfaz", etiqueta: "ID de interfaz", pista: "0:0:0:1", entrada: "texto", teclado: "text" }
      : { id: "subredes", etiqueta: "Subredes /64 que contiene", pista: "0", entrada: "texto", teclado: "decimal" },
  ],
  solucion: (d) => {
    const x = explicarPrefijo6(d);
    return { red: x.red, interfaz: x.interfaz ?? "", subredes: x.subredes ?? "" };
  },
  corregir(d, r): Correccion {
    const esperado = this.solucion(d);
    const red = corregirIPv6(r.red, esperado.red, red6(d.ip, d.prefijo));
    if (d.prefijo === 64) {
      return {
        red,
        interfaz: corregirIPv6(r.interfaz, esperado.interfaz, idInterfaz(d.ip), parsearInterfaz),
      };
    }
    return {
      red,
      subredes: corregirCampo(r.subredes, esperado.subredes, parsearHosts, Number(subredes64(d.prefijo)), MENSAJES.hosts),
    };
  },
};
