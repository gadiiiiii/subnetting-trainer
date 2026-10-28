import type { ExplicacionAbreviar } from "@/lib/abreviar6";
import GruposHex from "./GruposHex";
import { Paso, Pasos } from "./Paso";

const POSICION = ["1.º", "2.º", "3.º", "4.º", "5.º", "6.º", "7.º", "8.º"];

function rango(s: { inicio: number; largo: number }) {
  return Array.from({ length: s.largo }, (_, i) => s.inicio + i);
}

function describir(s: { inicio: number; largo: number }) {
  return `${s.largo} grupos desde el ${POSICION[s.inicio]}`;
}

export default function Abreviar6({ datos: x }: { datos: ExplicacionAbreviar }) {
  const completos = x.grupos.map((g) => g.completo);
  const sec = x.secuencia;
  const reglas = (
    <ul className="list-disc space-y-0.5 pl-5 text-[0.9375rem]">
      <li>Se usa una sola vez: si hubiera dos «::» no se sabría cuántos ceros va cada uno.</li>
      <li>Va en la secuencia de ceros más larga; si hay dos del mismo largo, en la primera.</li>
      <li>Un grupo en cero solo no se reemplaza: se escribe «0».</li>
    </ul>
  );

  if (x.sentido === "expandir") {
    const visibles = 8 - (sec?.largo ?? 0);
    return (
      <Pasos>
        <Paso titulo="Cuenta los grupos que se ven">
          <p>
            <code>{x.abreviada}</code> muestra {visibles} {visibles === 1 ? "grupo" : "grupos"}. Una dirección IPv6
            siempre tiene 8, así que {sec ? (
              <>
                el «::» reemplaza <strong>{sec.largo} grupos</strong> de <code>0000</code>.
              </>
            ) : (
              "no falta ninguno."
            )}
          </p>
        </Paso>
        <Paso titulo="Completa cada grupo hasta 4 dígitos">
          <p>Agrega ceros a la izquierda de cada grupo. Los grupos en naranjo son los que estaban escondidos en el «::».</p>
          <GruposHex grupos={completos} resaltados={sec ? rango(sec) : []} ceros="atenuados" etiqueta="Grupos completos" />
        </Paso>
        <Paso titulo="Resultado">
          <p className="[overflow-wrap:anywhere]">
            <code className="!whitespace-normal">{x.completa}</code>
          </p>
        </Paso>
      </Pasos>
    );
  }

  return (
    <Pasos>
      <Paso titulo="Quita los ceros a la izquierda de cada grupo">
        <p>
          En cada grupo, los ceros de la izquierda no cambian el valor (como 007 = 7). Se ven más suaves en la grilla:
          ésos se borran.
        </p>
        <GruposHex grupos={completos} ceros="atenuados" etiqueta="Grupos de la dirección" />
        <p>
          Queda <code className="!whitespace-normal">{x.grupos.map((g) => g.corto).join(":")}</code>
        </p>
      </Paso>

      <Paso titulo="Reemplaza por «::» la secuencia de ceros más larga">
        {sec ? (
          <>
            <p>
              La secuencia más larga son <strong>{describir(sec)}</strong> (en naranjo).
              {x.otras.length > 0 &&
                ` ${x.otras
                  .map((o) =>
                    o.largo === 1
                      ? `El 0 suelto del ${POSICION[o.inicio]} grupo se queda como 0`
                      : o.largo === sec.largo
                        ? `La de ${describir(o)} es igual de larga, pero está después`
                        : `La de ${describir(o)} es más corta`,
                  )
                  .join(". ")}: no se toca.`}
            </p>
            <GruposHex
              grupos={completos}
              resaltados={rango(sec)}
              apagados={x.otras.flatMap(rango)}
              etiqueta="Secuencia que se reemplaza"
            />
          </>
        ) : (
          <p>No hay dos o más grupos seguidos en cero, así que no se usa «::».</p>
        )}
        {reglas}
      </Paso>

      <Paso titulo="Resultado">
        <p>
          <code>{x.abreviada}</code>
        </p>
      </Paso>
    </Pasos>
  );
}
