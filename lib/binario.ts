import { crearAzar } from "./azar";
import {
  MENSAJES,
  corregirCampo,
  parsearBinario,
  parsearOcteto,
  type Correccion,
  type DefinicionTipo,
  type Dificultad,
} from "./ejercicio";
import { octetoBinario } from "./ipv4";

/**
 * Conversión de un octeto entre decimal y binario, la base de todo el
 * subnetting. En fácil solo aparecen valores de máscaras (0, 128, 192…).
 */

export interface DatosBinario {
  valor: number;
  sentido: "aBinario" | "aDecimal";
}

export const VALORES_MASCARA = [0, 128, 192, 224, 240, 248, 252, 254, 255];
export const PESOS = [128, 64, 32, 16, 8, 4, 2, 1];

export function generarBinario(semilla: string, dificultad: Dificultad): DatosBinario {
  const azar = crearAzar(`binario:${dificultad}:${semilla}`);
  const valor = dificultad === "facil" ? azar.elegir(VALORES_MASCARA) : azar.entero(0, 255);
  const sentido = dificultad === "media" ? "aBinario" : azar.siguiente() < 0.5 ? "aBinario" : "aDecimal";
  return { valor, sentido };
}

export interface PasoBinario {
  peso: number;
  bit: 0 | 1;
  /** Lo que quedaba por repartir antes de este peso (solo para decimal → binario). */
  antes: number;
  despues: number;
}

export interface ExplicacionBinario {
  valor: number;
  binario: string;
  sentido: DatosBinario["sentido"];
  pasos: PasoBinario[];
}

export function explicarBinario(d: DatosBinario): ExplicacionBinario {
  let resto = d.valor;
  const pasos = PESOS.map((peso) => {
    const bit: 0 | 1 = resto >= peso ? 1 : 0;
    const antes = resto;
    if (bit) resto -= peso;
    return { peso, bit, antes, despues: resto };
  });
  return { valor: d.valor, binario: octetoBinario(d.valor), sentido: d.sentido, pasos };
}

export const tipoBinario: DefinicionTipo<DatosBinario> = {
  nombre: "Binario",
  descripcion: {
    facil: "Valores de máscara (0, 128, 192…), en ambos sentidos",
    media: "Cualquier octeto, de decimal a binario",
    dificil: "Cualquier octeto, en ambos sentidos",
  },
  generar: generarBinario,
  enunciado: (d) =>
    d.sentido === "aBinario"
      ? { pregunta: "Convierte a binario", lineas: [{ valor: String(d.valor) }] }
      : { pregunta: "Convierte a decimal", lineas: [{ valor: octetoBinario(d.valor) }] },
  campos: (d) =>
    d.sentido === "aBinario"
      ? [{ id: "binario", etiqueta: "En binario (8 bits)", pista: "00000000", entrada: "texto", teclado: "decimal" }]
      : [{ id: "decimal", etiqueta: "En decimal", pista: "0", entrada: "texto", teclado: "decimal" }],
  solucion: (d) => ({ binario: octetoBinario(d.valor), decimal: String(d.valor) }),
  corregir(d, r): Correccion {
    const esperado = this.solucion(d);
    return d.sentido === "aBinario"
      ? { binario: corregirCampo(r.binario, esperado.binario, parsearBinario, d.valor, MENSAJES.binario) }
      : { decimal: corregirCampo(r.decimal, esperado.decimal, parsearOcteto, d.valor, MENSAJES.decimal) };
  },
};
