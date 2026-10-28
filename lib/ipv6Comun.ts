import type { Azar } from "./azar";
import type { ResultadoCampo } from "./ejercicio";
import { desdeGrupos, parsearIPv6, type IPv6 } from "./ipv6";

/** Piezas compartidas por los ejercicios IPv6. */

/** Un grupo con ceros a la izquierda (para practicar quitarlos): 0x00a5, 0x0db8… */
export function grupoCorto(azar: Azar): number {
  return azar.elegir([azar.entero(0x1, 0xf), azar.entero(0x10, 0xff), azar.entero(0x100, 0xfff)]);
}

export function grupoLargo(azar: Azar): number {
  return azar.entero(0x1000, 0xffff);
}

/** Primeros grupos realistas: el prefijo de documentación 2001:db8::/32 o uno global 2000::/3. */
export function inicioGlobal(azar: Azar, soloDocumentacion: boolean): [number, number] {
  if (soloDocumentacion || azar.siguiente() < 0.5) return [0x2001, 0x0db8];
  return [azar.entero(0x2000, 0x3fff), azar.entero(0, 0xffff)];
}

/** Una dirección global con grupos variados (para prefijos y EUI-64). */
export function direccionGlobal(azar: Azar, soloDocumentacion: boolean): IPv6 {
  const g = [...inicioGlobal(azar, soloDocumentacion)];
  for (let i = 2; i < 8; i++) {
    const r = azar.siguiente();
    g.push(r < 0.2 ? 0 : r < 0.55 ? grupoCorto(azar) : grupoLargo(azar));
  }
  return desdeGrupos(g);
}

/** Quita un "/n" final que alguien haya escrito por costumbre. */
export function sinPrefijo(texto: string): string {
  return texto.trim().replace(/\/\d{1,3}$/, "");
}

/**
 * Lee un ID de interfaz de 64 bits escrito como los 4 grupos de la derecha
 * ("5678:0:0:25", "5678::25") o como dirección completa ("::5678:0:0:25").
 */
export function parsearInterfaz(texto: string): IPv6 | null {
  const t = texto.trim();
  if (!t) return null;
  const limite = 1n << 64n;
  const directa = parsearIPv6(t);
  if (directa !== null && directa < limite && (t.startsWith("::") || t.split(":").length === 8)) return directa;
  const deCuatro = parsearIPv6(`0:0:0:0:${t}`);
  return deCuatro !== null && deCuatro < limite ? deCuatro : null;
}

/** 4 grupos de la derecha, sin ceros a la izquierda: "5678:0:0:25". */
export function formatearInterfaz(id: IPv6): string {
  return [3, 2, 1, 0].map((i) => Number((id >> BigInt(i * 16)) & 0xffffn).toString(16)).join(":");
}

/** Corrige un campo IPv6 comparando el valor, sin importar cómo se escribió. */
export function corregirIPv6(
  texto: string | undefined,
  esperado: string,
  correcto: IPv6,
  parsear: (t: string) => IPv6 | null = (t) => parsearIPv6(sinPrefijo(t)),
): ResultadoCampo {
  const t = (texto ?? "").trim();
  if (!t) return { estado: "vacio", esperado };
  const valor = parsear(t);
  if (valor === null) return { estado: "formato", esperado, mensaje: "Escribe una dirección IPv6, por ejemplo 2001:db8::1." };
  return { estado: valor === correcto ? "correcto" : "incorrecto", esperado };
}
