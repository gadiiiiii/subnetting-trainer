import { mascaraDesdePrefijo, parsearIPv4, prefijoDesdeMascara } from "./ipv4";

/**
 * Piezas comunes a todos los tipos de ejercicio: dificultad, campos de
 * respuesta, corrección y lectura de lo que escribe el usuario.
 */

export type Dificultad = "facil" | "media" | "dificil";

export const NOMBRE_DIFICULTAD: Record<Dificultad, string> = {
  facil: "Fácil",
  media: "Media",
  dificil: "Difícil",
};

export function esDificultad(valor: unknown): valor is Dificultad {
  return valor === "facil" || valor === "media" || valor === "dificil";
}

/** Prefijos posibles según la dificultad, compartidos por varios tipos. */
export const RANGO_PREFIJO: Record<Dificultad, [number, number]> = {
  facil: [24, 30],
  media: [16, 30],
  dificil: [8, 30],
};

export interface CampoDef {
  id: string;
  etiqueta: string;
  /** Texto de ejemplo dentro del campo vacío. */
  pista: string;
  /** "texto" se escribe; "sino" se responde con dos botones Sí / No. */
  entrada: "texto" | "sino";
  /** Teclado sugerido en el celular. */
  teclado?: "decimal" | "text";
}

/** Lo que se muestra como enunciado: una pregunta y una o más líneas destacadas. */
export interface Enunciado {
  pregunta: string;
  lineas: { valor: string; acento?: string; etiqueta?: string }[];
  nota?: string;
  /** Datos largos (direcciones IPv6): se muestran en un tamaño menor. */
  compacto?: boolean;
}

export type ResultadoCampo =
  | { estado: "correcto"; esperado: string }
  | { estado: "incorrecto"; esperado: string }
  | { estado: "vacio"; esperado: string }
  | { estado: "formato"; esperado: string; mensaje: string };

export type Correccion = Record<string, ResultadoCampo>;

export function contarCorrectas(c: Correccion): number {
  return Object.values(c).filter((r) => r.estado === "correcto").length;
}

export function totalCampos(c: Correccion): number {
  return Object.keys(c).length;
}

/**
 * Corrige un campo: si está vacío, si no se puede leer o si el valor leído
 * coincide con el correcto.
 */
export function corregirCampo<T>(
  texto: string | undefined,
  esperado: string,
  parsear: (t: string) => T | null,
  correcto: T,
  mensaje: string,
): ResultadoCampo {
  const t = (texto ?? "").trim();
  if (!t) return { estado: "vacio", esperado };
  const valor = parsear(t);
  if (valor === null) return { estado: "formato", esperado, mensaje };
  return { estado: valor === correcto ? "correcto" : "incorrecto", esperado };
}

export const MENSAJES = {
  ip: "Escribe una dirección como 192.168.1.0.",
  mascara: "Escribe la máscara como 255.255.255.224 o /27.",
  hosts: "Escribe solo el número, por ejemplo 30.",
  binario: "Escribe solo ceros y unos, por ejemplo 11000000.",
  decimal: "Escribe un número entre 0 y 255.",
  sino: "Elige Sí o No.",
};

export function formatearHosts(n: number): string {
  return new Intl.NumberFormat("es-CL").format(n);
}

/** Lee un número de hosts escrito con o sin separadores de miles: "524.286", "524 286", "30 hosts". */
export function parsearHosts(texto: string): number | null {
  const limpio = texto.trim().replace(/\s*hosts?$/i, "").replace(/[.\s,]/g, "");
  return /^\d{1,10}$/.test(limpio) ? Number(limpio) : null;
}

/** Lee una máscara como "255.255.255.224", "/27" o "27", y la devuelve como entero. */
export function parsearMascara(texto: string): number | null {
  const t = texto.trim();
  const prefijo = /^\/?(\d{1,2})$/.exec(t);
  if (prefijo) {
    const p = Number(prefijo[1]);
    return p <= 32 ? mascaraDesdePrefijo(p) : null;
  }
  const ip = parsearIPv4(t);
  return ip !== null && prefijoDesdeMascara(ip) !== null ? ip : null;
}

/** Lee un octeto en binario: "11000000", "1100 0000" o sin ceros a la izquierda. */
export function parsearBinario(texto: string): number | null {
  const limpio = texto.replace(/[\s.]/g, "");
  return /^[01]{1,8}$/.test(limpio) ? parseInt(limpio, 2) : null;
}

/** Lee un octeto en decimal (0 a 255). */
export function parsearOcteto(texto: string): number | null {
  const t = texto.trim();
  if (!/^\d{1,3}$/.test(t)) return null;
  const n = Number(t);
  return n <= 255 ? n : null;
}

/** Lee una respuesta Sí / No. */
export function parsearSiNo(texto: string): boolean | null {
  const t = texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  if (t === "si" || t === "s") return true;
  if (t === "no" || t === "n") return false;
  return null;
}

/** Lo que cada tipo de ejercicio debe saber hacer. */
export interface DefinicionTipo<D> {
  nombre: string;
  /** Qué cubre cada dificultad, en una frase. */
  descripcion: Record<Dificultad, string>;
  generar(semilla: string, dificultad: Dificultad): D;
  enunciado(datos: D): Enunciado;
  campos(datos: D): CampoDef[];
  solucion(datos: D): Record<string, string>;
  corregir(datos: D, respuestas: Record<string, string>): Correccion;
}
