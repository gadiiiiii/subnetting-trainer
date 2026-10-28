/**
 * Utilidades IPv6 sin dependencias de interfaz.
 *
 * Las direcciones se representan como BigInt de 128 bits. Los grupos son los
 * 8 bloques de 16 bits que se escriben en hexadecimal separados por ":".
 */

export type IPv6 = bigint;

const BITS = 128n;
const MAX = (1n << BITS) - 1n;

/** Los 8 grupos de 16 bits, del más significativo al menos. */
export function grupos(ip: IPv6): number[] {
  return Array.from({ length: 8 }, (_, i) => Number((ip >> BigInt((7 - i) * 16)) & 0xffffn));
}

export function desdeGrupos(g: readonly number[]): IPv6 {
  return g.reduce((acc, v) => (acc << 16n) | BigInt(v), 0n);
}

/**
 * Lee una dirección IPv6 en cualquier forma válida: completa, sin ceros a la
 * izquierda o con "::". Acepta mayúsculas y espacios alrededor. No acepta
 * prefijo ("/64") ni una IPv4 incrustada. Devuelve null si no es válida.
 */
export function parsearIPv6(texto: string): IPv6 | null {
  const t = texto.trim().toLowerCase();
  if (!/^[0-9a-f:]+$/.test(t)) return null;
  const partes = t.split("::");
  if (partes.length > 2) return null;

  const leer = (s: string) => (s === "" ? [] : s.split(":"));
  const izq = leer(partes[0]);
  const der = partes.length === 2 ? leer(partes[1]) : [];
  const todos = [...izq, ...der];
  if (todos.some((g) => !/^[0-9a-f]{1,4}$/.test(g))) return null;

  let valores: string[];
  if (partes.length === 2) {
    const faltan = 8 - izq.length - der.length;
    if (faltan < 1) return null; // "::" debe reemplazar al menos un grupo
    valores = [...izq, ...Array(faltan).fill("0"), ...der];
  } else {
    valores = izq;
  }
  if (valores.length !== 8) return null;
  return desdeGrupos(valores.map((g) => parseInt(g, 16)));
}

/** Forma completa: 8 grupos de 4 dígitos. "2001:0db8:0000:…" */
export function expandir(ip: IPv6): string {
  return grupos(ip)
    .map((g) => g.toString(16).padStart(4, "0"))
    .join(":");
}

/** La secuencia más larga de grupos en cero (de 2 o más). En empate, la primera. */
export function secuenciaCeros(g: readonly number[]): { inicio: number; largo: number } | null {
  let mejor: { inicio: number; largo: number } | null = null;
  for (let i = 0; i < g.length; ) {
    if (g[i] !== 0) {
      i++;
      continue;
    }
    let j = i;
    while (j < g.length && g[j] === 0) j++;
    const largo = j - i;
    if (largo >= 2 && (!mejor || largo > mejor.largo)) mejor = { inicio: i, largo };
    i = j;
  }
  return mejor;
}

/**
 * Forma abreviada canónica (RFC 5952): sin ceros a la izquierda, minúsculas y
 * "::" en la secuencia de ceros más larga (de al menos 2 grupos; si hay
 * empate, la primera).
 */
export function abreviar(ip: IPv6): string {
  const g = grupos(ip);
  const hex = g.map((v) => v.toString(16));
  const s = secuenciaCeros(g);
  if (!s) return hex.join(":");
  const izq = hex.slice(0, s.inicio).join(":");
  const der = hex.slice(s.inicio + s.largo).join(":");
  return `${izq}::${der}`;
}

export function esPrefijoValido6(p: number): boolean {
  return Number.isInteger(p) && p >= 0 && p <= 128;
}

export function mascara6(prefijo: number): IPv6 {
  if (!esPrefijoValido6(prefijo)) throw new Error(`Prefijo IPv6 inválido: /${prefijo}`);
  return prefijo === 0 ? 0n : (MAX << (BITS - BigInt(prefijo))) & MAX;
}

export function red6(ip: IPv6, prefijo: number): IPv6 {
  return ip & mascara6(prefijo);
}

/** Los 64 bits de la derecha: el ID de interfaz en una subred /64. */
export function idInterfaz(ip: IPv6): IPv6 {
  return ip & ((1n << 64n) - 1n);
}

/** Cantidad de subredes /64 dentro de un prefijo más corto. */
export function subredes64(prefijo: number): bigint {
  if (prefijo > 64) return 0n;
  return 1n << BigInt(64 - prefijo);
}

// ── MAC y EUI-64 ──

export type MAC = number[]; // 6 bytes

/**
 * Lee una MAC en los formatos habituales: "00:1a:2b:3c:4d:5e",
 * "00-1A-2B-3C-4D-5E" o el de Cisco "001a.2b3c.4d5e".
 */
export function parsearMAC(texto: string): MAC | null {
  const t = texto.trim().toLowerCase();
  let hex: string;
  if (/^([0-9a-f]{2}[:-]){5}[0-9a-f]{2}$/.test(t)) hex = t.replace(/[:-]/g, "");
  else if (/^[0-9a-f]{4}\.[0-9a-f]{4}\.[0-9a-f]{4}$/.test(t)) hex = t.replace(/\./g, "");
  else return null;
  return hex.match(/.{2}/g)!.map((b) => parseInt(b, 16));
}

export function formatearMAC(mac: MAC, estilo: "dos-puntos" | "cisco" = "dos-puntos"): string {
  const h = mac.map((b) => b.toString(16).padStart(2, "0"));
  return estilo === "cisco"
    ? `${h[0]}${h[1]}.${h[2]}${h[3]}.${h[4]}${h[5]}`
    : h.join(":");
}

/**
 * ID de interfaz EUI-64: se parte la MAC en dos mitades, se inserta FFFE al
 * medio y se invierte el séptimo bit del primer byte (el bit U/L, 0x02).
 */
export function eui64(mac: MAC): IPv6 {
  const b = [mac[0] ^ 0x02, mac[1], mac[2], 0xff, 0xfe, mac[3], mac[4], mac[5]];
  return b.reduce((acc, v) => (acc << 8n) | BigInt(v), 0n);
}

/** Dirección completa a partir de un prefijo /64 y una MAC. */
export function direccionEUI64(prefijo64: IPv6, mac: MAC): IPv6 {
  return red6(prefijo64, 64) | eui64(mac);
}

/** Un grupo de 16 bits en binario, de a 4 bits: 0x2001 → "0010 0000 0000 0001". */
export function grupoBinario(g: number): string {
  return g.toString(2).padStart(16, "0").match(/.{4}/g)!.join(" ");
}
