import type { ExplicacionPrefijo6 } from "@/lib/prefijo6";
import GruposHex from "./GruposHex";
import { Paso, Pasos } from "./Paso";

const POSICION = ["primer", "segundo", "tercer", "cuarto", "quinto", "sexto", "séptimo", "octavo"];

export default function Prefijo6({ datos: x }: { datos: ExplicacionPrefijo6 }) {
  const grupos = x.completa.split(":");
  const digitosRed = Math.floor(x.prefijo / 4);
  const digitosEnGrupo = Math.floor((x.prefijo % 16) / 4);
  const bin = (v: number) => v.toString(2).padStart(4, "0");

  return (
    <Pasos>
      <Paso titulo="Escribe la dirección completa">
        <p>
          Con los 8 grupos de 4 dígitos es más fácil contar. Cada grupo son 16 bits y cada dígito hexadecimal, 4 bits.
        </p>
        <GruposHex grupos={grupos} prefijo={x.prefijo} etiqueta="Dirección completa" />
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="size-3.5 rounded-[3px] border-[1.5px] border-red bg-red-soft" aria-hidden="true" /> red
          <span className="ml-3 size-3.5 rounded-[3px] border-[1.5px] border-host bg-host-soft" aria-hidden="true" />{" "}
          interfaz
        </p>
      </Paso>

      <Paso titulo={`Cuenta ${x.prefijo} bits desde la izquierda`}>
        <p>
          /{x.prefijo} = {x.gruposCompletos} {x.gruposCompletos === 1 ? "grupo completo" : "grupos completos"} (
          {x.gruposCompletos} × 16 = {x.gruposCompletos * 16})
          {digitosEnGrupo > 0 && ` + ${digitosEnGrupo} ${digitosEnGrupo === 1 ? "dígito" : "dígitos"} (${digitosEnGrupo} × 4 = ${digitosEnGrupo * 4})`}
          {x.corte && ` + ${x.corte.bitsDeRed} ${x.corte.bitsDeRed === 1 ? "bit" : "bits"} de un dígito`}. Son{" "}
          {digitosRed} dígitos completos de red.
        </p>
        {x.corte && (
          <>
            <p>
              El prefijo corta el {x.corte.digito + 1}.º dígito del {POSICION[x.corte.grupo]} grupo (subrayado). Ese
              dígito vale <code>{x.corte.valor.toString(16)}</code> = <code>{bin(x.corte.valor)}</code>:{" "}
              {x.corte.bitsDeRed === 1 ? "se conserva su primer bit" : `se conservan sus ${x.corte.bitsDeRed} primeros bits`} y el
              resto va en 0.
            </p>
            <p className="font-mono">
              <span className="font-bold text-red">{bin(x.corte.valor).slice(0, x.corte.bitsDeRed)}</span>
              <span className="text-host">{bin(x.corte.valor).slice(x.corte.bitsDeRed)}</span>
              {" → "}
              <span className="font-bold text-red">{bin(x.corte.queda).slice(0, x.corte.bitsDeRed)}</span>
              <span>{"0".repeat(4 - x.corte.bitsDeRed)}</span> = <strong>{x.corte.queda.toString(16)}</strong>
            </p>
          </>
        )}
      </Paso>

      <Paso titulo="Todo lo demás va en cero">
        <p>Los bits de interfaz (en azul) se ponen en 0. Queda:</p>
        <p className="[overflow-wrap:anywhere]">
          <code className="!whitespace-normal">{x.redCompleta}</code>
        </p>
        <p>
          Abreviada: <code>{x.red}</code>
        </p>
      </Paso>

      {x.subredes && (
        <Paso titulo="Cuántas /64 caben">
          <p>
            Entre /{x.prefijo} y /64 hay {64 - x.prefijo} bits para numerar subredes: 2<sup>{64 - x.prefijo}</sup> ={" "}
            <strong>{x.subredes}</strong> subredes /64.
          </p>
        </Paso>
      )}

      {x.interfaz && (
        <Paso titulo="El ID de interfaz">
          <p>
            Son los 4 grupos de la derecha (64 bits): <code>{x.interfaz}</code>.
          </p>
        </Paso>
      )}
    </Pasos>
  );
}
