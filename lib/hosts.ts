import { crearAzar } from "./azar";
import {
  MENSAJES,
  corregirCampo,
  formatearHosts,
  parsearHosts,
  parsearMascara,
  type DefinicionTipo,
  type Dificultad,
} from "./ejercicio";
import { formatearIPv4, mascaraDesdePrefijo } from "./ipv4";

/**
 * Prefijo para N hosts: "necesito 50 hosts, ¿qué prefijo uso?".
 *
 * Se usa la regla clásica del CCNA: hosts utilizables = 2^h − 2, con al menos
 * 2 bits de host. Por eso el ejercicio va hasta /29 y no pregunta por enlaces
 * de 2 hosts, donde /30 y /31 (RFC 3021) serían ambos válidos.
 */

export interface DatosHosts {
  necesarios: number;
  prefijo: number;
  lugar: string;
}

const RANGO: Record<Dificultad, [number, number]> = {
  facil: [24, 29],
  media: [16, 29],
  dificil: [8, 29],
};

const LUGARES: Record<Dificultad, string[]> = {
  facil: [
    "la oficina de Tránsito",
    "el laboratorio de computación",
    "la sala de reuniones",
    "la red Wi-Fi de invitados",
    "el área de Finanzas",
    "las cámaras de seguridad",
    "la biblioteca",
  ],
  media: [
    "el edificio municipal",
    "el campus de un liceo",
    "la red Wi-Fi de un hospital",
    "las sucursales de una empresa",
    "los teléfonos IP de un call center",
  ],
  dificil: [
    "los clientes de un proveedor de internet",
    "los sensores de una ciudad",
    "los dispositivos de una universidad",
    "la red de una empresa de telecomunicaciones",
  ],
};

export function hostsUtilizablesClasico(bitsHost: number): number {
  return 2 ** bitsHost - 2;
}

export function generarHosts(semilla: string, dificultad: Dificultad): DatosHosts {
  const azar = crearAzar(`hosts:${dificultad}:${semilla}`);
  const prefijo = azar.entero(...RANGO[dificultad]);
  const h = 32 - prefijo;
  // Más de lo que cabe con un bit de host menos, y no más de lo que cabe con h bits.
  const necesarios = azar.entero(hostsUtilizablesClasico(h - 1) + 1, hostsUtilizablesClasico(h));
  return { necesarios, prefijo, lugar: azar.elegir(LUGARES[dificultad]) };
}

export interface ExplicacionHosts {
  necesarios: number;
  /** Bits de host probados, desde el que no alcanza hasta el que sí. */
  intentos: { bits: number; potencia: number; hosts: number; alcanza: boolean }[];
  bitsHost: number;
  prefijo: number;
  mascara: string;
  hosts: number;
}

export function explicarHosts(d: DatosHosts): ExplicacionHosts {
  const bitsHost = 32 - d.prefijo;
  const intentos = [bitsHost - 1, bitsHost].map((bits) => ({
    bits,
    potencia: 2 ** bits,
    hosts: hostsUtilizablesClasico(bits),
    alcanza: hostsUtilizablesClasico(bits) >= d.necesarios,
  }));
  return {
    necesarios: d.necesarios,
    intentos,
    bitsHost,
    prefijo: d.prefijo,
    mascara: formatearIPv4(mascaraDesdePrefijo(d.prefijo)),
    hosts: hostsUtilizablesClasico(bitsHost),
  };
}

export const tipoHosts: DefinicionTipo<DatosHosts> = {
  nombre: "Prefijo para N hosts",
  descripcion: {
    facil: "Hasta 254 hosts, prefijos /24 a /29",
    media: "Hasta 65.534 hosts, prefijos /16 a /29",
    dificil: "Hasta millones de hosts, prefijos /8 a /29",
  },
  generar: generarHosts,
  enunciado: (d) => ({
    pregunta: "¿Qué prefijo necesitas para",
    lineas: [{ valor: `${formatearHosts(d.necesarios)} hosts` }],
    nota: `Es la red de ${d.lugar}. Usa la subred más chica que alcance.`,
  }),
  campos: () => [
    { id: "prefijo", etiqueta: "Prefijo", pista: "/24", entrada: "texto", teclado: "text" },
    { id: "mascara", etiqueta: "Máscara", pista: "255.255.255.0", entrada: "texto", teclado: "text" },
    { id: "hosts", etiqueta: "Hosts utilizables", pista: "0", entrada: "texto", teclado: "decimal" },
  ],
  solucion: (d) => ({
    prefijo: `/${d.prefijo}`,
    mascara: formatearIPv4(mascaraDesdePrefijo(d.prefijo)),
    hosts: formatearHosts(hostsUtilizablesClasico(32 - d.prefijo)),
  }),
  corregir(d, r) {
    const esperado = this.solucion(d);
    const mascara = mascaraDesdePrefijo(d.prefijo);
    return {
      prefijo: corregirCampo(r.prefijo, esperado.prefijo, parsearMascara, mascara, "Escribe el prefijo con barra, por ejemplo /24."),
      mascara: corregirCampo(r.mascara, esperado.mascara, parsearMascara, mascara, MENSAJES.mascara),
      hosts: corregirCampo(r.hosts, esperado.hosts, parsearHosts, hostsUtilizablesClasico(32 - d.prefijo), MENSAJES.hosts),
    };
  },
};
