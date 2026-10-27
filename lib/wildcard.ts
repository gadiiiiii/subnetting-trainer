import { crearAzar } from "./azar";
import { DESCRIPCION_REDES, direccionAlAzar } from "./basico";
import {
  MENSAJES,
  corregirCampo,
  parsearMascara,
  type Correccion,
  type DefinicionTipo,
  type Dificultad,
} from "./ejercicio";
import {
  direccionDeRed,
  formatearIPv4,
  mascaraDesdePrefijo,
  octetos,
  parsearIPv4,
  wildcardDesdePrefijo,
  type IPv4,
} from "./ipv4";

/**
 * Wildcards, como se usan en ACL y en el comando network de OSPF.
 * Dos sentidos: de la red a la wildcard, y de la wildcard a la red.
 */

export interface DatosWildcard {
  red: IPv4;
  prefijo: number;
  sentido: "aWildcard" | "aPrefijo";
  uso: "acl" | "ospf";
}

export function generarWildcard(semilla: string, dificultad: Dificultad): DatosWildcard {
  const azar = crearAzar(`wildcard:${dificultad}:${semilla}`);
  const { ip, prefijo } = direccionAlAzar(azar, dificultad);
  return {
    red: direccionDeRed(ip, prefijo),
    prefijo,
    sentido: azar.siguiente() < 0.5 ? "aWildcard" : "aPrefijo",
    uso: azar.siguiente() < 0.5 ? "acl" : "ospf",
  };
}

function comando(d: DatosWildcard): string {
  const red = formatearIPv4(d.red);
  const wildcard = formatearIPv4(wildcardDesdePrefijo(d.prefijo));
  return d.uso === "acl" ? `access-list 10 permit ${red} ${wildcard}` : `network ${red} ${wildcard} area 0`;
}

export interface ExplicacionWildcard {
  prefijo: number;
  sentido: DatosWildcard["sentido"];
  mascara: string;
  wildcard: string;
  mascaraBits: string;
  wildcardBits: string;
  /** Resta octeto por octeto: 255 − máscara = wildcard. */
  restas: { mascara: number; wildcard: number }[];
  comando: string;
}

export function explicarWildcard(d: DatosWildcard): ExplicacionWildcard {
  const mascara = mascaraDesdePrefijo(d.prefijo);
  const wildcard = wildcardDesdePrefijo(d.prefijo);
  const bits = (n: number) => n.toString(2).padStart(32, "0");
  const om = octetos(mascara);
  const ow = octetos(wildcard);
  return {
    prefijo: d.prefijo,
    sentido: d.sentido,
    mascara: formatearIPv4(mascara),
    wildcard: formatearIPv4(wildcard),
    mascaraBits: bits(mascara),
    wildcardBits: bits(wildcard),
    restas: om.map((m, i) => ({ mascara: m, wildcard: ow[i] })),
    comando: comando(d),
  };
}

export const tipoWildcard: DefinicionTipo<DatosWildcard> = {
  nombre: "Wildcard",
  descripcion: DESCRIPCION_REDES,
  generar: generarWildcard,
  enunciado(d) {
    const red = formatearIPv4(d.red);
    if (d.sentido === "aWildcard") {
      return {
        pregunta:
          d.uso === "acl" ? "¿Qué wildcard usas en la ACL para la red" : "¿Qué wildcard usas en OSPF para la red",
        lineas: [{ valor: red, acento: `/${d.prefijo}` }],
        nota:
          d.uso === "acl"
            ? `Va en una línea como: access-list 10 permit ${red} ?`
            : `Va en el comando: network ${red} ? area 0`,
      };
    }
    return {
      pregunta: "¿Qué prefijo cubre esta wildcard?",
      lineas: [
        { etiqueta: "Red", valor: red },
        { etiqueta: "Wildcard", valor: formatearIPv4(wildcardDesdePrefijo(d.prefijo)) },
      ],
      nota: `Aparece en: ${comando(d)}`,
    };
  },
  campos: (d) =>
    d.sentido === "aWildcard"
      ? [
          { id: "mascara", etiqueta: "Máscara", pista: "255.255.255.0", entrada: "texto", teclado: "text" },
          { id: "wildcard", etiqueta: "Wildcard", pista: "0.0.0.255", entrada: "texto", teclado: "decimal" },
        ]
      : [
          { id: "prefijo", etiqueta: "Prefijo", pista: "/24", entrada: "texto", teclado: "text" },
          { id: "mascara", etiqueta: "Máscara", pista: "255.255.255.0", entrada: "texto", teclado: "text" },
        ],
  solucion: (d) => ({
    prefijo: `/${d.prefijo}`,
    mascara: formatearIPv4(mascaraDesdePrefijo(d.prefijo)),
    wildcard: formatearIPv4(wildcardDesdePrefijo(d.prefijo)),
  }),
  corregir(d, r): Correccion {
    const esperado = this.solucion(d);
    const mascara = mascaraDesdePrefijo(d.prefijo);
    const mascaraCorregida = corregirCampo(r.mascara, esperado.mascara, parsearMascara, mascara, MENSAJES.mascara);
    if (d.sentido === "aWildcard") {
      return {
        mascara: mascaraCorregida,
        wildcard: corregirCampo(
          r.wildcard,
          esperado.wildcard,
          parsearIPv4,
          wildcardDesdePrefijo(d.prefijo),
          "Escribe la wildcard como 0.0.0.255.",
        ),
      };
    }
    return {
      prefijo: corregirCampo(r.prefijo, esperado.prefijo, parsearMascara, mascara, "Escribe el prefijo como /26."),
      mascara: mascaraCorregida,
    };
  },
};
