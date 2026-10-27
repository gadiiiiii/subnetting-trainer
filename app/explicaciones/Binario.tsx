import type { ExplicacionBinario } from "@/lib/binario";
import { cn } from "@/lib/utils";
import { Paso, Pasos } from "./Paso";

export default function Binario({ datos: x }: { datos: ExplicacionBinario }) {
  const sumandos = x.pasos.filter((p) => p.bit === 1).map((p) => p.peso);
  const celda = "w-[2.1rem] py-1.5 text-center sm:w-11";

  return (
    <Pasos>
      <Paso titulo="Los pesos de cada bit">
        <p>Cada posición de un octeto vale el doble que la de su derecha, desde 1 hasta 128.</p>
        <div className="overflow-x-auto">
          <table className="border-separate border-spacing-0.5 font-mono text-[0.8125rem] sm:border-spacing-1 sm:text-[0.9375rem]">
            <tbody>
              <tr>
                <th scope="row" className="pr-2 text-left font-sans text-xs font-semibold text-muted-foreground">
                  Peso
                </th>
                {x.pasos.map((p) => (
                  <td key={p.peso} className={cn(celda, "rounded-sm border border-border bg-card")}>
                    {p.peso}
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row" className="pr-2 text-left font-sans text-xs font-semibold text-muted-foreground">
                  Bit
                </th>
                {x.pasos.map((p) => (
                  <td
                    key={p.peso}
                    className={cn(
                      celda,
                      "rounded-sm border",
                      p.bit ? "border-red bg-red-soft font-bold text-red" : "border-border bg-card text-muted-foreground",
                    )}
                  >
                    {p.bit}
                  </td>
                ))}
              </tr>
              {x.sentido === "aBinario" && (
                <tr>
                  <th scope="row" className="pr-2 text-left font-sans text-xs font-semibold text-muted-foreground">
                    Queda
                  </th>
                  {x.pasos.map((p) => (
                    <td key={p.peso} className={cn(celda, "text-xs text-muted-foreground")}>
                      {p.despues}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Paso>

      {x.sentido === "aBinario" ? (
        <Paso titulo="De izquierda a derecha, resta lo que quepa">
          <p>Parte con {x.valor}. Si el peso cabe en lo que queda, ese bit es 1 y se resta; si no, es 0.</p>
          <ul className="list-disc space-y-0.5 pl-5 text-[0.9375rem]">
            {x.pasos.map((p) => (
              <li key={p.peso}>
                {p.bit ? (
                  <>
                    {p.peso} cabe en {p.antes}: bit en <strong>1</strong>, quedan {p.antes} − {p.peso} = {p.despues}.
                  </>
                ) : (
                  <>
                    {p.peso} no cabe en {p.antes}: bit en <strong>0</strong>.
                  </>
                )}
              </li>
            ))}
          </ul>
          <p>
            Resultado: <code>{x.binario}</code>
          </p>
        </Paso>
      ) : (
        <Paso titulo="Suma los pesos donde hay un 1">
          <p>
            {sumandos.length === 0 ? (
              <>
                No hay ningún 1, así que el valor es <strong>0</strong>.
              </>
            ) : (
              <>
                {sumandos.join(" + ")} = <strong>{x.valor}</strong>
              </>
            )}
          </p>
        </Paso>
      )}
    </Pasos>
  );
}
