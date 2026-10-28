import { crearAzar } from "./azar";
import type { Correccion, DefinicionTipo, Dificultad } from "./ejercicio";
import { abreviar, direccionEUI64, eui64, formatearMAC, red6, type IPv6, type MAC } from "./ipv6";
import { corregirIPv6, direccionGlobal, formatearInterfaz, parsearInterfaz } from "./ipv6Comun";

/**
 * EUI-64: la interfaz arma su ID a partir de la MAC (SLAAC o
 * «ipv6 address … eui-64»). Se parte la MAC, se inserta FFFE y se invierte
 * el séptimo bit del primer byte.
 */

export interface DatosEUI64 {
  prefijo: IPv6;
  mac: MAC;
  formato: "dos-puntos" | "cisco";
}

export function generarEUI64(semilla: string, dificultad: Dificultad): DatosEUI64 {
  const azar = crearAzar(`eui64:${dificultad}:${semilla}`);
  let primero: number;
  if (dificultad === "facil") primero = 0x00;
  else if (dificultad === "media") primero = azar.elegir([0x00, 0x00, 0x08, 0x0c, 0x10, 0x18, 0x20, 0x50, 0x88, 0xa4]);
  // Difícil: cualquier MAC unicast (bit menos significativo en 0), a veces con el bit U/L ya en 1.
  else primero = azar.entero(0, 127) * 2;
  const mac = [primero, ...Array.from({ length: 5 }, () => azar.entero(0, 255))];
  return {
    prefijo: red6(direccionGlobal(azar, dificultad === "facil"), 64),
    mac,
    formato: dificultad === "facil" || azar.siguiente() < 0.5 ? "cisco" : "dos-puntos",
  };
}

export interface ExplicacionEUI64 {
  mac: string;
  bytes: string[];
  primero: number;
  primeroInvertido: number;
  interfaz: string;
  prefijo: string;
  direccion: string;
}

export function explicarEUI64(d: DatosEUI64): ExplicacionEUI64 {
  return {
    mac: formatearMAC(d.mac, d.formato),
    bytes: d.mac.map((b) => b.toString(16).padStart(2, "0")),
    primero: d.mac[0],
    primeroInvertido: d.mac[0] ^ 0x02,
    interfaz: formatearInterfaz(eui64(d.mac)),
    prefijo: `${abreviar(d.prefijo)}/64`,
    direccion: abreviar(direccionEUI64(d.prefijo, d.mac)),
  };
}

export const tipoEUI64: DefinicionTipo<DatosEUI64> = {
  nombre: "IPv6: EUI-64",
  descripcion: {
    facil: "MAC que empieza en 00, prefijo 2001:db8::/64",
    media: "MAC variadas: invertir el bit U/L",
    dificil: "Cualquier MAC, a veces con el bit U/L ya en 1",
  },
  generar: generarEUI64,
  enunciado: (d) => ({
    pregunta: "Calcula la dirección EUI-64",
    lineas: [
      { etiqueta: "Prefijo", valor: abreviar(d.prefijo), acento: "/64" },
      { etiqueta: "MAC", valor: formatearMAC(d.mac, d.formato) },
    ],
    nota: "La interfaz se configuró con «ipv6 address … eui-64»: el ID de interfaz sale de su MAC.",
    compacto: true,
  }),
  campos: () => [
    { id: "interfaz", etiqueta: "ID de interfaz", pista: "0219:d2ff:fea1:b2c3", entrada: "texto", teclado: "text" },
    { id: "direccion", etiqueta: "Dirección completa", pista: "2001:db8:1:1::", entrada: "texto", teclado: "text" },
  ],
  solucion: (d) => {
    const x = explicarEUI64(d);
    return { interfaz: x.interfaz, direccion: x.direccion };
  },
  corregir(d, r): Correccion {
    const esperado = this.solucion(d);
    return {
      interfaz: corregirIPv6(r.interfaz, esperado.interfaz, eui64(d.mac), parsearInterfaz),
      direccion: corregirIPv6(r.direccion, esperado.direccion, direccionEUI64(d.prefijo, d.mac)),
    };
  },
};
