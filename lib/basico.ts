import { crearAzar } from "./azar";
import {
  calcularSubred,
  desdeOctetos,
  formatearIPv4,
  mascaraDesdePrefijo,
  octetos,
  parsearIPv4,
  prefijoDesdeMascara,
  type IPv4,
} from "./ipv4";

/**
 * Ejercicio básico: dada una dirección con prefijo, calcular máscara, red,
 * broadcast, primer y último host, y cantidad de hosts utilizables.
 */

export type Dificultad = "facil" | "media" | "dificil";

export const DIFICULTADES: Record<Dificultad, { nombre: string; descripcion: string }> = {
  facil: { nombre: "Fácil", descripcion: "Redes 192.168.x.x, prefijos /24 a /30" },
  media: { nombre: "Media", descripcion: "Redes 172.16–31.x.x, prefijos /16 a /30" },
  dificil: { nombre: "Difícil", descripcion: "Cualquier red unicast, prefijos /8 a /30" },
};

export function esDificultad(valor: unknown): valor is Dificultad {
  return valor === "facil" || valor === "media" || valor === "dificil";
}

export interface EjercicioBasico {
  semilla: string;
  dificultad: Dificultad;
  ip: IPv4;
  prefijo: number;
}

/** Genera siempre el mismo ejercicio para la misma semilla y dificultad. */
export function generarBasico(semilla: string, dificultad: Dificultad): EjercicioBasico {
  const azar = crearAzar(`basico:${dificultad}:${semilla}`);
  let primeros: [number, number];
  let prefijo: number;

  if (dificultad === "facil") {
    primeros = [192, 168];
    prefijo = azar.entero(24, 30);
  } else if (dificultad === "media") {
    primeros = [172, azar.entero(16, 31)];
    prefijo = azar.entero(16, 30);
  } else {
    // Unicast de clases A, B y C, sin 0.x.x.x ni el loopback 127.x.x.x.
    let primero: number;
    do primero = azar.entero(1, 223);
    while (primero === 127);
    primeros = [primero, azar.entero(0, 255)];
    prefijo = azar.entero(8, 30);
  }

  // Elige una dirección de host: que no sea la de red ni la de broadcast.
  let ip: IPv4;
  do {
    ip = desdeOctetos([...primeros, azar.entero(0, 255), azar.entero(0, 255)]);
    const s = calcularSubred(ip, prefijo);
    if (ip !== s.red && ip !== s.broadcast) break;
  } while (true);

  return { semilla, dificultad, ip, prefijo };
}

export const CAMPOS = ["mascara", "red", "broadcast", "primerHost", "ultimoHost", "hosts"] as const;
export type Campo = (typeof CAMPOS)[number];

export const ETIQUETAS: Record<Campo, string> = {
  mascara: "Máscara",
  red: "Dirección de red",
  broadcast: "Broadcast",
  primerHost: "Primer host",
  ultimoHost: "Último host",
  hosts: "Hosts utilizables",
};

export type Respuestas = Record<Campo, string>;

export type ResultadoCampo =
  | { estado: "correcto"; esperado: string }
  | { estado: "incorrecto"; esperado: string }
  | { estado: "vacio"; esperado: string }
  | { estado: "formato"; esperado: string; mensaje: string };

export type Correccion = Record<Campo, ResultadoCampo>;

export function solucionBasico(e: EjercicioBasico): Record<Campo, string> {
  const s = calcularSubred(e.ip, e.prefijo);
  return {
    mascara: formatearIPv4(s.mascara),
    red: formatearIPv4(s.red),
    broadcast: formatearIPv4(s.broadcast),
    primerHost: formatearIPv4(s.primerHost),
    ultimoHost: formatearIPv4(s.ultimoHost),
    hosts: formatearHosts(s.hosts),
  };
}

export function formatearHosts(n: number): string {
  return new Intl.NumberFormat("es-CL").format(n);
}

/** Lee un número de hosts escrito con o sin separadores de miles: "524.286", "524 286", "30 hosts". */
export function parsearHosts(texto: string): number | null {
  const limpio = texto.trim().replace(/\s*hosts?$/i, "").replace(/[.\s,]/g, "");
  return /^\d{1,10}$/.test(limpio) ? Number(limpio) : null;
}

/** Lee una máscara como "255.255.255.224", "/27" o "27". */
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

export function corregirBasico(e: EjercicioBasico, respuestas: Partial<Respuestas>): Correccion {
  const s = calcularSubred(e.ip, e.prefijo);
  const esperado = solucionBasico(e);
  const resultado = {} as Correccion;

  for (const campo of CAMPOS) {
    const texto = (respuestas[campo] ?? "").trim();
    if (!texto) {
      resultado[campo] = { estado: "vacio", esperado: esperado[campo] };
      continue;
    }

    let valor: number | null;
    let correcto: number;
    let mensaje: string;
    if (campo === "hosts") {
      valor = parsearHosts(texto);
      correcto = s.hosts;
      mensaje = "Escribe solo el número, por ejemplo 30.";
    } else if (campo === "mascara") {
      valor = parsearMascara(texto);
      correcto = s.mascara;
      mensaje = "Escribe la máscara como 255.255.255.224 o /27.";
    } else {
      valor = parsearIPv4(texto);
      correcto = s[campo];
      mensaje = "Escribe una dirección como 192.168.1.0.";
    }

    if (valor === null) resultado[campo] = { estado: "formato", esperado: esperado[campo], mensaje };
    else resultado[campo] = { estado: valor === correcto ? "correcto" : "incorrecto", esperado: esperado[campo] };
  }
  return resultado;
}

export function contarCorrectas(c: Correccion): number {
  return CAMPOS.filter((campo) => c[campo].estado === "correcto").length;
}

/**
 * Datos para explicar el ejercicio paso a paso. La interfaz arma el texto;
 * aquí solo se calculan los números de cada paso.
 */
export interface Explicacion {
  prefijo: number;
  bitsHost: number;
  ipBits: string;
  mascaraBits: string;
  redBits: string;
  broadcastBits: string;
  /**
   * El octeto donde la máscara no es ni 255 ni 0. Si el prefijo es múltiplo
   * de 8 no existe, y la red se obtiene copiando octetos completos.
   */
  octetoInteresante: {
    /** 1 a 4 */
    posicion: number;
    valorIp: number;
    valorMascara: number;
    /** 256 − valorMascara: cada cuánto empieza una subred en ese octeto. */
    bloque: number;
    /** Cuántos bloques completos caben antes de la IP. */
    cociente: number;
    /** Valor del octeto en la dirección de red. */
    inicio: number;
    /** Valor del octeto en el broadcast. */
    fin: number;
  } | null;
  /** Octetos completos de red (los que se copian tal cual). */
  octetosCompletos: number;
  hosts: number;
  solucion: Record<Campo, string>;
}

export function explicarBasico(e: EjercicioBasico): Explicacion {
  const s = calcularSubred(e.ip, e.prefijo);
  const bits = (n: number) => n.toString(2).padStart(32, "0");
  const octetosCompletos = Math.floor(e.prefijo / 8);

  let octetoInteresante: Explicacion["octetoInteresante"] = null;
  if (e.prefijo % 8 !== 0) {
    const i = octetosCompletos; // índice 0-3
    const valorIp = octetos(e.ip)[i];
    const valorMascara = octetos(s.mascara)[i];
    const bloque = 256 - valorMascara;
    const cociente = Math.floor(valorIp / bloque);
    octetoInteresante = {
      posicion: i + 1,
      valorIp,
      valorMascara,
      bloque,
      cociente,
      inicio: cociente * bloque,
      fin: cociente * bloque + bloque - 1,
    };
  }

  return {
    prefijo: e.prefijo,
    bitsHost: 32 - e.prefijo,
    ipBits: bits(e.ip),
    mascaraBits: bits(s.mascara),
    redBits: bits(s.red),
    broadcastBits: bits(s.broadcast),
    octetoInteresante,
    octetosCompletos,
    hosts: s.hosts,
    solucion: solucionBasico(e),
  };
}
