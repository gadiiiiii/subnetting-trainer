import type { ExplicacionEUI64 } from "@/lib/eui64";
import { cn } from "@/lib/utils";
import { Paso, Pasos } from "./Paso";

function Bytes({ bytes, resaltar = [], invertido }: { bytes: string[]; resaltar?: number[]; invertido?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5 pt-1 font-mono" aria-hidden="true">
      {bytes.map((b, i) => (
        <span
          key={i}
          className={cn(
            "rounded-sm border px-2 py-1 text-[0.9375rem]",
            resaltar.includes(i) ? "border-red bg-red-soft font-bold text-red" : "border-border bg-card",
            invertido && i === 0 && "border-host bg-host-soft font-bold text-host",
          )}
        >
          {b}
        </span>
      ))}
    </div>
  );
}

export default function EUI64({ datos: x }: { datos: ExplicacionEUI64 }) {
  const insertado = [...x.bytes.slice(0, 3), "ff", "fe", ...x.bytes.slice(3)];
  const invertido = [x.primeroInvertido.toString(16).padStart(2, "0"), ...insertado.slice(1)];
  const bin = (v: number) => v.toString(2).padStart(8, "0");
  const antes = bin(x.primero);
  const despues = bin(x.primeroInvertido);
  const seApaga = (x.primero & 0x02) !== 0;

  return (
    <Pasos>
      <Paso titulo="Parte la MAC en dos mitades">
        <p>
          La MAC <code>{x.mac}</code> tiene 6 bytes: 3 del fabricante y 3 del equipo.
        </p>
        <Bytes bytes={x.bytes} />
      </Paso>

      <Paso titulo="Inserta FFFE al medio">
        <p>Entre las dos mitades van los bytes ff y fe, para llegar a los 64 bits del ID de interfaz.</p>
        <Bytes bytes={insertado} resaltar={[3, 4]} />
      </Paso>

      <Paso titulo="Invierte el séptimo bit del primer byte">
        <p>
          Es el bit U/L (universal/local). Se cuenta desde la izquierda, empezando en 1: vale 2 en decimal.{" "}
          {seApaga ? "Aquí ya estaba en 1, así que pasa a 0." : "Aquí estaba en 0, así que pasa a 1."}
        </p>
        <p className="font-mono">
          {antes.slice(0, 6)}
          <span className="font-bold text-red underline decoration-2 underline-offset-2">{antes[6]}</span>
          {antes[7]} ({x.bytes[0]}) → {despues.slice(0, 6)}
          <span className="font-bold text-host underline decoration-2 underline-offset-2">{despues[6]}</span>
          {despues[7]} ({x.primeroInvertido.toString(16).padStart(2, "0")})
        </p>
        <Bytes bytes={invertido} invertido />
      </Paso>

      <Paso titulo="Arma el ID y únelo al prefijo">
        <p>
          Agrupa de a 2 bytes: el ID de interfaz es <code>{x.interfaz}</code>. Va a la derecha del prefijo{" "}
          <code>{x.prefijo}</code>:
        </p>
        <p className="[overflow-wrap:anywhere]">
          <code className="!whitespace-normal">{x.direccion}</code>
        </p>
      </Paso>
    </Pasos>
  );
}
