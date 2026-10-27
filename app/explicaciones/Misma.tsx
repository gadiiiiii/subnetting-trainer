import { formatearIPv4 } from "@/lib/ipv4";
import type { ExplicacionMisma } from "@/lib/misma";
import TiraBits, { LeyendaBits } from "../TiraBits";
import { Paso, Pasos } from "./Paso";

const ORDINAL = ["", "primer", "segundo", "tercer", "cuarto"];

export default function Misma({ datos: x }: { datos: ExplicacionMisma }) {
  const ip = (bits: string) => formatearIPv4(parseInt(bits, 2));
  const oa = x.a.octetoInteresante;
  const ob = x.b.octetoInteresante;
  // Octetos que se copian tal cual (antes del interesante) y que son distintos entre A y B.
  const octetosDe = (bits: string) => bits.match(/.{8}/g)!.map((b) => parseInt(b, 2));
  const oA = octetosDe(x.a.ipBits);
  const oB = octetosDe(x.b.ipBits);
  const anteriores = oa
    ? oA
        .slice(0, oa.posicion - 1)
        .map((v, i) => ({ posicion: i + 1, a: v, b: oB[i] }))
        .filter((d) => d.a !== d.b)
    : [];

  return (
    <Pasos>
      <Paso titulo="Calcula la red de cada una">
        <p>
          Las dos usan /{x.prefijo}, así que se les aplica la misma máscara ({x.a.solucion.mascara}). Un AND entre cada
          IP y la máscara da su dirección de red.
        </p>
        <TiraBits
          prefijo={x.prefijo}
          filas={[
            { etiqueta: "PC A", bits: x.a.ipBits, decimal: ip(x.a.ipBits) },
            { etiqueta: "PC B", bits: x.b.ipBits, decimal: ip(x.b.ipBits) },
            { etiqueta: "Máscara", bits: x.a.mascaraBits, decimal: x.a.solucion.mascara },
            { etiqueta: "Red de A", bits: x.a.redBits, decimal: x.a.solucion.red, destacada: true },
            { etiqueta: "Red de B", bits: x.b.redBits, decimal: x.b.solucion.red, destacada: true },
          ]}
        />
        <LeyendaBits />
        <p>Basta con comparar los bits naranjos: si son iguales, están en la misma subred.</p>
      </Paso>

      {oa && ob && (
        <Paso titulo="Con el atajo decimal">
          <p>
            En el {ORDINAL[oa.posicion]} octeto el tamaño de bloque es 256 − {oa.valorMascara} ={" "}
            <strong>{oa.bloque}</strong>. PC A tiene {oa.valorIp} en ese octeto, que cae en el bloque{" "}
            <strong>
              {oa.inicio}–{oa.fin}
            </strong>
            . PC B tiene {ob.valorIp}, que cae en{" "}
            <strong>
              {ob.inicio}–{ob.fin}
            </strong>
            .
          </p>
          {anteriores.length > 0 && (
            <p>
              Ojo: además cambian los octetos anteriores (
              {anteriores.map((d) => `${ORDINAL[d.posicion]} octeto: ${d.a} y ${d.b}`).join(", ")}), así que las redes
              no pueden coincidir aunque los bloques se parezcan.
            </p>
          )}
        </Paso>
      )}

      <Paso titulo="Conclusión">
        {x.misma ? (
          <p>
            Las dos redes son <code>{x.a.solucion.red}</code>: están en la <strong>misma subred</strong> y se comunican
            directamente, sin router.
          </p>
        ) : (
          <p>
            Las redes son distintas (<code>{x.a.solucion.red}</code> y <code>{x.b.solucion.red}</code>):{" "}
            <strong>no están en la misma subred</strong>. Para comunicarse necesitan un router, y cada PC envía el
            tráfico a su puerta de enlace.
          </p>
        )}
      </Paso>
    </Pasos>
  );
}
