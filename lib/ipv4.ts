/**
 * Utilidades IPv4 sin dependencias de interfaz.
 *
 * Las direcciones se representan como enteros sin signo de 32 bits
 * (0 … 4 294 967 295). En JavaScript los operadores de bits trabajan con
 * enteros con signo, así que cada resultado se pasa por `>>> 0` para volver
 * a sin signo.
 */

export type IPv4 = number;

const MAX = 0xffffffff;

export function esPrefijoValido(prefijo: number): boolean {
  return Number.isInteger(prefijo) && prefijo >= 0 && prefijo <= 32;
}

function exigirPrefijo(prefijo: number) {
  if (!esPrefijoValido(prefijo)) throw new Error(`Prefijo inválido: /${prefijo}. Debe estar entre /0 y /32.`);
}

/**
 * Lee una dirección en notación decimal punteada. Acepta espacios alrededor y
 * ceros a la izquierda en cada octeto ("192.168.001.010"). Devuelve null si no
 * es una dirección válida.
 */
export function parsearIPv4(texto: string): IPv4 | null {
  const partes = texto.trim().split(".");
  if (partes.length !== 4) return null;
  let valor = 0;
  for (const parte of partes) {
    if (!/^\d{1,3}$/.test(parte)) return null;
    const octeto = Number(parte);
    if (octeto > 255) return null;
    valor = valor * 256 + octeto;
  }
  return valor;
}

export function formatearIPv4(ip: IPv4): string {
  return octetos(ip).join(".");
}

export function octetos(ip: IPv4): [number, number, number, number] {
  return [(ip >>> 24) & 255, (ip >>> 16) & 255, (ip >>> 8) & 255, ip & 255];
}

export function desdeOctetos(o: readonly number[]): IPv4 {
  return (((o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0) as IPv4;
}

/** /27 → 255.255.255.224 (como entero). */
export function mascaraDesdePrefijo(prefijo: number): IPv4 {
  exigirPrefijo(prefijo);
  return prefijo === 0 ? 0 : (MAX << (32 - prefijo)) >>> 0;
}

/** 255.255.255.224 → 27. Devuelve null si los unos no son contiguos. */
export function prefijoDesdeMascara(mascara: IPv4): number | null {
  const invertida = ~mascara >>> 0;
  // Una máscara válida, invertida, tiene la forma 0…01…1: sumarle 1 da una potencia de 2.
  if ((invertida & (invertida + 1)) !== 0) return null;
  let prefijo = 0;
  for (let m = mascara; m & 0x80000000; m = (m << 1) >>> 0) prefijo++;
  return prefijo;
}

/** Wildcard (máscara inversa), usada en ACL y OSPF: /27 → 0.0.0.31. */
export function wildcardDesdePrefijo(prefijo: number): IPv4 {
  return ~mascaraDesdePrefijo(prefijo) >>> 0;
}

export function direccionDeRed(ip: IPv4, prefijo: number): IPv4 {
  return (ip & mascaraDesdePrefijo(prefijo)) >>> 0;
}

export function direccionBroadcast(ip: IPv4, prefijo: number): IPv4 {
  return (direccionDeRed(ip, prefijo) | wildcardDesdePrefijo(prefijo)) >>> 0;
}

/**
 * Hosts utilizables: 2^(32−prefijo) − 2.
 * /31 tiene 2 (enlaces punto a punto, RFC 3021) y /32 tiene 1 (una sola dirección).
 */
export function hostsUtilizables(prefijo: number): number {
  exigirPrefijo(prefijo);
  if (prefijo === 32) return 1;
  if (prefijo === 31) return 2;
  return 2 ** (32 - prefijo) - 2;
}

/** Cantidad total de direcciones del bloque, incluidas red y broadcast. */
export function tamanoBloque(prefijo: number): number {
  exigirPrefijo(prefijo);
  return 2 ** (32 - prefijo);
}

export interface Subred {
  red: IPv4;
  broadcast: IPv4;
  primerHost: IPv4;
  ultimoHost: IPv4;
  mascara: IPv4;
  wildcard: IPv4;
  prefijo: number;
  hosts: number;
}

export function calcularSubred(ip: IPv4, prefijo: number): Subred {
  const red = direccionDeRed(ip, prefijo);
  const broadcast = direccionBroadcast(ip, prefijo);
  const sinRedNiBroadcast = prefijo <= 30;
  return {
    red,
    broadcast,
    primerHost: sinRedNiBroadcast ? red + 1 : red,
    ultimoHost: sinRedNiBroadcast ? broadcast - 1 : broadcast,
    mascara: mascaraDesdePrefijo(prefijo),
    wildcard: wildcardDesdePrefijo(prefijo),
    prefijo,
    hosts: hostsUtilizables(prefijo),
  };
}

/** El prefijo más largo (la subred más chica) que alcanza para `hosts` hosts. */
export function prefijoParaHosts(hosts: number): number | null {
  if (!Number.isInteger(hosts) || hosts < 1) return null;
  for (let prefijo = 32; prefijo >= 0; prefijo--) {
    if (hostsUtilizables(prefijo) >= hosts) return prefijo;
  }
  return null;
}

export function mismaSubred(a: IPv4, b: IPv4, prefijo: number): boolean {
  return direccionDeRed(a, prefijo) === direccionDeRed(b, prefijo);
}

/** Un octeto en binario de 8 dígitos: 224 → "11100000". */
export function octetoBinario(octeto: number): string {
  return octeto.toString(2).padStart(8, "0");
}

/** La dirección completa en binario, separada por puntos. */
export function ipBinaria(ip: IPv4): string {
  return octetos(ip).map(octetoBinario).join(".");
}
