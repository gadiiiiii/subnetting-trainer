import { crearAzar } from "./azar";
import type { Correccion, DefinicionTipo, Dificultad, ResultadoCampo } from "./ejercicio";
import { abreviar, desdeGrupos, expandir, grupos, parsearIPv6, secuenciaCeros, type IPv6 } from "./ipv6";
import { grupoCorto, grupoLargo, inicioGlobal } from "./ipv6Comun";

/**
 * Abreviar y expandir direcciones IPv6, con las reglas que pide el CCNA
 * (RFC 5952): quitar ceros a la izquierda de cada grupo y reemplazar por "::"
 * la secuencia de grupos en cero más larga, una sola vez.
 */

export interface DatosAbreviar {
  ip: IPv6;
  sentido: "abreviar" | "expandir";
}

/**
 * Fácil: una sola secuencia de ceros. Media: además grupos con ceros a la
 * izquierda. Difícil: dos secuencias de ceros (a veces del mismo largo) para
 * que haya que elegir dónde va el "::".
 */
export function generarAbreviar(semilla: string, dificultad: Dificultad): DatosAbreviar {
  const azar = crearAzar(`abreviar6:${dificultad}:${semilla}`);
  const g: number[] = [...inicioGlobal(azar, dificultad === "facil")];
  const resto = 6;

  const tramo = Array<"cero" | "valor">(resto).fill("valor");
  const ceros = (inicio: number, largo: number) => {
    for (let i = inicio; i < inicio + largo && i < resto; i++) tramo[i] = "cero";
  };

  if (dificultad === "dificil") {
    // Dos secuencias separadas por al menos un grupo con valor.
    const a = azar.entero(2, 3);
    const b = Math.min(azar.entero(2, 3), resto - a - 1);
    const inicioA = azar.entero(0, resto - a - b - 1);
    ceros(inicioA, a);
    ceros(azar.entero(inicioA + a + 1, resto - b), b);
  } else {
    const largo = azar.entero(2, dificultad === "facil" ? 4 : 3);
    ceros(azar.entero(0, resto - largo), largo);
  }

  for (const t of tramo) {
    if (t === "cero") g.push(0);
    else g.push(dificultad === "facil" ? (azar.siguiente() < 0.7 ? grupoLargo(azar) : grupoCorto(azar)) : azar.siguiente() < 0.6 ? grupoCorto(azar) : grupoLargo(azar));
  }

  // En difícil, a veces un 0 suelto en el inicio para recordar que un solo grupo no se reemplaza por "::".
  if (dificultad === "dificil" && azar.siguiente() < 0.3) g[1] = 0;

  return { ip: desdeGrupos(g), sentido: azar.siguiente() < 0.5 ? "abreviar" : "expandir" };
}

export interface ExplicacionAbreviar {
  sentido: DatosAbreviar["sentido"];
  completa: string;
  abreviada: string;
  /** Cada grupo con y sin ceros a la izquierda. */
  grupos: { completo: string; corto: string }[];
  /** Secuencia de ceros reemplazada por "::" (índices de grupo), si hay. */
  secuencia: { inicio: number; largo: number } | null;
  /** Otras secuencias de ceros que no se reemplazan (porque son más cortas o están después). */
  otras: { inicio: number; largo: number }[];
}

export function explicarAbreviar(d: DatosAbreviar): ExplicacionAbreviar {
  const g = grupos(d.ip);
  const secuencia = secuenciaCeros(g);
  const otras: { inicio: number; largo: number }[] = [];
  for (let i = 0; i < 8; ) {
    if (g[i] !== 0) {
      i++;
      continue;
    }
    let j = i;
    while (j < 8 && g[j] === 0) j++;
    if (!secuencia || i !== secuencia.inicio) otras.push({ inicio: i, largo: j - i });
    i = j;
  }
  return {
    sentido: d.sentido,
    completa: expandir(d.ip),
    abreviada: abreviar(d.ip),
    grupos: g.map((v) => ({ completo: v.toString(16).padStart(4, "0"), corto: v.toString(16) })),
    secuencia,
    otras,
  };
}

function corregirForma(texto: string | undefined, d: DatosAbreviar): ResultadoCampo {
  const esperado = d.sentido === "abreviar" ? abreviar(d.ip) : expandir(d.ip);
  const t = (texto ?? "").trim().toLowerCase();
  if (!t) return { estado: "vacio", esperado };
  const valor = parsearIPv6(t);
  if (valor === null) {
    return { estado: "formato", esperado, mensaje: "No es una dirección IPv6 válida: revisa los grupos y que haya un solo «::»." };
  }
  if (valor !== d.ip) return { estado: "incorrecto", esperado };
  if (t === esperado) return { estado: "correcto", esperado };
  return {
    estado: "formato",
    esperado,
    mensaje:
      d.sentido === "abreviar"
        ? "Es la misma dirección, pero se puede abreviar más."
        : "Es la misma dirección, pero hay que escribir los 8 grupos de 4 dígitos.",
  };
}

export const tipoAbreviar: DefinicionTipo<DatosAbreviar> = {
  nombre: "IPv6: abreviar y expandir",
  descripcion: {
    facil: "2001:db8::, una sola secuencia de ceros",
    media: "Grupos con ceros a la izquierda",
    dificil: "Dos secuencias de ceros: elegir dónde va el ::",
  },
  generar: generarAbreviar,
  enunciado: (d) =>
    d.sentido === "abreviar"
      ? {
          pregunta: "Escribe en su forma más corta",
          lineas: [{ valor: expandir(d.ip) }],
          compacto: true,
        }
      : {
          pregunta: "Escribe completa, con los 8 grupos",
          lineas: [{ valor: abreviar(d.ip) }],
          compacto: true,
        },
  campos: (d) => [
    d.sentido === "abreviar"
      ? { id: "abreviada", etiqueta: "Forma abreviada", pista: "2001:db8::1", entrada: "texto", teclado: "text" }
      : { id: "completa", etiqueta: "Forma completa", pista: "2001:0db8:0000:…", entrada: "texto", teclado: "text" },
  ],
  solucion: (d) => ({ abreviada: abreviar(d.ip), completa: expandir(d.ip) }),
  corregir(d, r): Correccion {
    return d.sentido === "abreviar" ? { abreviada: corregirForma(r.abreviada, d) } : { completa: corregirForma(r.completa, d) };
  },
};
