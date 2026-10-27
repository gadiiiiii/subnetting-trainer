import { crearAzar } from "./azar";
import { DESCRIPCION_REDES, direccionAlAzar, explicarBasico, type Explicacion } from "./basico";
import {
  MENSAJES,
  corregirCampo,
  parsearSiNo,
  type DefinicionTipo,
  type Dificultad,
} from "./ejercicio";
import { calcularSubred, formatearIPv4, mismaSubred, parsearIPv4, tamanoBloque, type IPv4 } from "./ipv4";

/**
 * ¿Misma subred?: dadas dos direcciones con el mismo prefijo, decidir si
 * están en la misma subred (y por lo tanto se comunican sin router).
 *
 * La mitad de las veces sí lo están. La otra mitad, la segunda dirección cae
 * en la subred vecina, cerca del límite, para que la respuesta no sea obvia
 * mirando solo los números.
 */

export interface DatosMisma {
  a: IPv4;
  b: IPv4;
  prefijo: number;
  misma: boolean;
  dificultad: Dificultad;
}

export function generarMisma(semilla: string, dificultad: Dificultad): DatosMisma {
  const azar = crearAzar(`misma:${dificultad}:${semilla}`);
  const { ip: a, prefijo } = direccionAlAzar(azar, dificultad);
  const s = calcularSubred(a, prefijo);
  const hosts = s.ultimoHost - s.primerHost + 1;
  const quiereMisma = azar.siguiente() < 0.5;

  if (quiereMisma) {
    let b: IPv4;
    do b = s.primerHost + azar.entero(0, hosts - 1);
    while (b === a);
    return { a, b, prefijo, misma: true, dificultad };
  }

  // Subred vecina: la anterior o la siguiente, la que exista.
  const bloque = tamanoBloque(prefijo);
  const haySiguiente = s.broadcast + bloque <= 0xffffffff;
  const hayAnterior = s.red >= bloque;
  const siguiente = haySiguiente && (!hayAnterior || azar.siguiente() < 0.5);
  const cerca = Math.min(hosts, 12); // a pocas direcciones del límite
  const b = siguiente
    ? s.broadcast + 1 + azar.entero(1, cerca) // justo después de la red vecina
    : s.red - 1 - azar.entero(1, cerca); // justo antes del broadcast vecino
  return { a, b, prefijo, misma: false, dificultad };
}

export interface ExplicacionMisma {
  a: Explicacion;
  b: Explicacion;
  misma: boolean;
  prefijo: number;
}

export function explicarMisma(d: DatosMisma): ExplicacionMisma {
  const base = { semilla: "", dificultad: d.dificultad, prefijo: d.prefijo };
  return {
    a: explicarBasico({ ...base, ip: d.a }),
    b: explicarBasico({ ...base, ip: d.b }),
    misma: d.misma,
    prefijo: d.prefijo,
  };
}

export const tipoMisma: DefinicionTipo<DatosMisma> = {
  nombre: "¿Misma subred?",
  descripcion: DESCRIPCION_REDES,
  generar: generarMisma,
  enunciado: (d) => ({
    pregunta: "¿Están en la misma subred?",
    lineas: [
      { etiqueta: "PC A", valor: formatearIPv4(d.a), acento: `/${d.prefijo}` },
      { etiqueta: "PC B", valor: formatearIPv4(d.b), acento: `/${d.prefijo}` },
    ],
    nota: "Calcula la red de cada una. Si no coinciden, necesitan un router para comunicarse.",
  }),
  campos: () => [
    { id: "redA", etiqueta: "Red de PC A", pista: "0.0.0.0", entrada: "texto", teclado: "decimal" },
    { id: "redB", etiqueta: "Red de PC B", pista: "0.0.0.0", entrada: "texto", teclado: "decimal" },
    { id: "misma", etiqueta: "¿Misma subred?", pista: "", entrada: "sino" },
  ],
  solucion: (d) => ({
    redA: formatearIPv4(calcularSubred(d.a, d.prefijo).red),
    redB: formatearIPv4(calcularSubred(d.b, d.prefijo).red),
    misma: d.misma ? "Sí" : "No",
  }),
  corregir(d, r) {
    const esperado = this.solucion(d);
    return {
      redA: corregirCampo(r.redA, esperado.redA, parsearIPv4, calcularSubred(d.a, d.prefijo).red, MENSAJES.ip),
      redB: corregirCampo(r.redB, esperado.redB, parsearIPv4, calcularSubred(d.b, d.prefijo).red, MENSAJES.ip),
      misma: corregirCampo(r.misma, esperado.misma, parsearSiNo, mismaSubred(d.a, d.b, d.prefijo), MENSAJES.sino),
    };
  },
};
