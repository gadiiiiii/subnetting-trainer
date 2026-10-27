import { crearAzar } from "./azar";
import {
  MENSAJES,
  RANGO_PREFIJO,
  contarCorrectas,
  corregirCampo,
  formatearHosts,
  parsearHosts,
  parsearMascara,
  type CampoDef,
  type Correccion,
  type DefinicionTipo,
  type Dificultad,
  type ResultadoCampo,
} from "./ejercicio";
import { calcularSubred, desdeOctetos, formatearIPv4, octetos, parsearIPv4, type IPv4 } from "./ipv4";

export { contarCorrectas, formatearHosts, parsearHosts, parsearMascara };
export type { Correccion, Dificultad, ResultadoCampo };

/**
 * Ejercicio básico: dada una dirección con prefijo, calcular máscara, red,
 * broadcast, primer y último host, y cantidad de hosts utilizables.
 */

export const DESCRIPCION_REDES: Record<Dificultad, string> = {
  facil: "Redes 192.168.x.x, prefijos /24 a /30",
  media: "Redes 172.16–31.x.x, prefijos /16 a /30",
  dificil: "Cualquier red unicast, prefijos /8 a /30",
};

/**
 * Una dirección de host al azar según la dificultad, con su prefijo.
 * La comparten los tipos que parten de una IP (subred, misma subred, wildcard).
 */
export function direccionAlAzar(
  azar: ReturnType<typeof crearAzar>,
  dificultad: Dificultad,
  rango: [number, number] = RANGO_PREFIJO[dificultad],
): { ip: IPv4; prefijo: number } {
  let primeros: [number, number];
  if (dificultad === "facil") {
    primeros = [192, 168];
  } else if (dificultad === "media") {
    primeros = [172, azar.entero(16, 31)];
  } else {
    // Unicast de clases A, B y C, sin 0.x.x.x ni el loopback 127.x.x.x.
    let primero: number;
    do primero = azar.entero(1, 223);
    while (primero === 127);
    primeros = [primero, azar.entero(0, 255)];
  }
  const prefijo = azar.entero(rango[0], rango[1]);

  // Que no sea la dirección de red ni la de broadcast.
  let ip: IPv4;
  do {
    ip = desdeOctetos([...primeros, azar.entero(0, 255), azar.entero(0, 255)]);
    const s = calcularSubred(ip, prefijo);
    if (ip !== s.red && ip !== s.broadcast) break;
  } while (true);
  return { ip, prefijo };
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
  const { ip, prefijo } = direccionAlAzar(azar, dificultad);
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

export function corregirBasico(e: EjercicioBasico, respuestas: Partial<Respuestas>): Correccion {
  const s = calcularSubred(e.ip, e.prefijo);
  const esperado = solucionBasico(e);
  const resultado: Correccion = {};
  for (const campo of CAMPOS) {
    const texto = respuestas[campo];
    resultado[campo] =
      campo === "hosts"
        ? corregirCampo(texto, esperado.hosts, parsearHosts, s.hosts, MENSAJES.hosts)
        : campo === "mascara"
          ? corregirCampo(texto, esperado.mascara, parsearMascara, s.mascara, MENSAJES.mascara)
          : corregirCampo(texto, esperado[campo], parsearIPv4, s[campo], MENSAJES.ip);
  }
  return resultado;
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

const PISTAS: Record<Campo, string> = {
  mascara: "255.255.255.0",
  red: "0.0.0.0",
  broadcast: "0.0.0.0",
  primerHost: "0.0.0.0",
  ultimoHost: "0.0.0.0",
  hosts: "0",
};

export const tipoSubred: DefinicionTipo<EjercicioBasico> = {
  nombre: "Subred",
  descripcion: DESCRIPCION_REDES,
  generar: generarBasico,
  enunciado: (e) => ({
    pregunta: "Calcula la subred de",
    lineas: [{ valor: formatearIPv4(e.ip), acento: `/${e.prefijo}` }],
  }),
  campos: (): CampoDef[] =>
    CAMPOS.map((id) => ({
      id,
      etiqueta: ETIQUETAS[id],
      pista: PISTAS[id],
      entrada: "texto",
      teclado: id === "mascara" ? "text" : "decimal",
    })),
  solucion: solucionBasico,
  corregir: corregirBasico,
};
