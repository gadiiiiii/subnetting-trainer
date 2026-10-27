import type { Explicacion as Datos } from "@/lib/basico";
import { formatearHosts } from "@/lib/ejercicio";
import { formatearIPv4 } from "@/lib/ipv4";
import { cn } from "@/lib/utils";
import TiraBits, { LeyendaBits } from "../TiraBits";
import { Paso, Pasos } from "./Paso";

const ORDINAL = ["", "primer", "segundo", "tercer", "cuarto"];

function decimal(bits: string) {
  return formatearIPv4(parseInt(bits, 2));
}

/** Los bloques vecinos en el octeto interesante, con una marca donde cae la IP. */
export function Bloques({ x }: { x: NonNullable<Datos["octetoInteresante"]> }) {
  const tramos = [x.inicio - x.bloque, x.inicio, x.inicio + x.bloque].filter((v) => v >= 0 && v <= 255);
  return (
    <div className="flex max-w-md gap-1 pt-3" aria-hidden="true">
      {tramos.map((inicio) => {
        const actual = inicio === x.inicio;
        return (
          <div
            key={inicio}
            className={cn(
              "relative flex h-13 flex-1 items-end justify-center rounded-sm border pb-1.5 font-mono text-[0.8125rem]",
              actual ? "border-red bg-red-soft font-bold text-red" : "border-border bg-card text-muted-foreground",
            )}
          >
            {inicio}–{inicio + x.bloque - 1}
            {actual && (
              <span
                className="absolute -top-3 -translate-x-1/2 rounded-sm bg-foreground px-1.5 text-xs leading-5 font-bold text-background"
                style={{ left: `${((x.valorIp - inicio + 0.5) / x.bloque) * 100}%` }}
              >
                {x.valorIp}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Subred({ datos: x }: { datos: Datos }) {
  const oi = x.octetoInteresante;
  const especial = x.prefijo >= 31;

  return (
    <Pasos>
      <Paso titulo="Del prefijo a la máscara">
        <p>
          /{x.prefijo} significa {x.prefijo} bits de red y {x.bitsHost} de host (32 − {x.prefijo}). La máscara son{" "}
          {x.prefijo} unos seguidos de {x.bitsHost} ceros: <code>{x.solucion.mascara}</code>.
        </p>
      </Paso>

      <Paso titulo="La red, en binario">
        <p>
          La dirección de red es un AND entre la IP y la máscara: donde la máscara tiene 1 se copia el bit de la IP, y
          donde tiene 0 queda 0. Para el broadcast, los bits de host van todos en 1.
        </p>
        <TiraBits
          prefijo={x.prefijo}
          filas={[
            { etiqueta: "IP", bits: x.ipBits, decimal: decimal(x.ipBits) },
            { etiqueta: "Máscara", bits: x.mascaraBits, decimal: x.solucion.mascara },
            { etiqueta: "Red", bits: x.redBits, decimal: x.solucion.red, destacada: true },
            { etiqueta: "Broadcast", bits: x.broadcastBits, decimal: x.solucion.broadcast, destacada: true },
          ]}
        />
        <LeyendaBits />
      </Paso>

      <Paso titulo="El atajo en decimal">
        {oi ? (
          <>
            <p>
              El octeto que importa es el {ORDINAL[oi.posicion]}: ahí la máscara vale <strong>{oi.valorMascara}</strong>,
              ni 255 ni 0.
              {x.octetosCompletos === 1 && " El primer octeto se copia tal cual."}
              {x.octetosCompletos > 1 && ` Los ${x.octetosCompletos} primeros octetos se copian tal cual.`}
            </p>
            <p>
              Tamaño de bloque: 256 − {oi.valorMascara} = <strong>{oi.bloque}</strong>. Las subredes empiezan cada{" "}
              {oi.bloque}: 0, {oi.bloque}, {oi.bloque * 2}…
            </p>
            <p>
              {oi.valorIp} ÷ {oi.bloque} = {oi.cociente}, descartando el resto. {oi.cociente} × {oi.bloque} ={" "}
              <strong>{oi.inicio}</strong>: ahí empieza la subred. La siguiente empieza en {oi.inicio + oi.bloque}, así
              que esta termina en <strong>{oi.fin}</strong>.
            </p>
            <Bloques x={oi} />
            {oi.posicion < 4 && (
              <p>Los octetos a la derecha son todos de host: en la red van en 0 y en el broadcast en 255.</p>
            )}
          </>
        ) : (
          <p>
            El prefijo /{x.prefijo} cae justo al final del {ORDINAL[x.octetosCompletos]} octeto, así que no hay que
            dividir nada: se copian los primeros {x.octetosCompletos} octetos, y el resto va en 0 para la red y en 255
            para el broadcast.
          </p>
        )}
      </Paso>

      <Paso titulo="Hosts y rango">
        {especial ? (
          <p>
            /{x.prefijo} es un caso especial:{" "}
            {x.prefijo === 31
              ? "se usa en enlaces punto a punto y sus 2 direcciones son utilizables (RFC 3021)."
              : "identifica una sola dirección, típicamente una interfaz loopback."}
          </p>
        ) : (
          <p>
            Hosts utilizables = 2<sup>{x.bitsHost}</sup> − 2 = {formatearHosts(2 ** x.bitsHost)} − 2 ={" "}
            <strong>{formatearHosts(x.hosts)}</strong>. Se restan la dirección de red y la de broadcast. El primer host
            es la red + 1 (<code>{x.solucion.primerHost}</code>) y el último, el broadcast − 1 (
            <code>{x.solucion.ultimoHost}</code>).
          </p>
        )}
      </Paso>
    </Pasos>
  );
}
