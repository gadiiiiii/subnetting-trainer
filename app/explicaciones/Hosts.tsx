import { formatearHosts } from "@/lib/ejercicio";
import type { ExplicacionHosts } from "@/lib/hosts";
import { cn } from "@/lib/utils";
import { Paso, Pasos } from "./Paso";

export default function Hosts({ datos: x }: { datos: ExplicacionHosts }) {
  const sobran = x.hosts - x.necesarios;
  return (
    <Pasos>
      <Paso titulo="Cuántos bits de host necesitas">
        <p>
          Con h bits de host caben 2<sup>h</sup> − 2 hosts: se restan la dirección de red y la de broadcast. Busca el h
          más chico que alcance para {formatearHosts(x.necesarios)}.
        </p>
        <div className="overflow-x-auto">
          <table className="mt-2 w-full max-w-md overflow-hidden rounded-lg border border-border bg-card text-sm">
            <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">Bits de host</th>
                <th scope="col" className="px-3 py-2 font-semibold">Hosts utilizables</th>
                <th scope="col" className="px-3 py-2 font-semibold">¿Alcanza?</th>
              </tr>
            </thead>
            <tbody>
              {x.intentos.map((i) => (
                <tr key={i.bits} className="border-t border-border">
                  <td className="px-3 py-2 font-mono">{i.bits}</td>
                  <td className="px-3 py-2 font-mono">
                    2<sup>{i.bits}</sup> − 2 = <strong>{formatearHosts(i.hosts)}</strong>
                  </td>
                  <td className={cn("px-3 py-2 font-semibold", i.alcanza ? "text-success" : "text-destructive")}>
                    {i.alcanza ? "Sí" : "No"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Paso>

      <Paso titulo="De los bits de host al prefijo">
        <p>
          Prefijo = 32 − {x.bitsHost} = <strong>/{x.prefijo}</strong>. La máscara son {x.prefijo} unos seguidos de{" "}
          {x.bitsHost} ceros: <code>{x.mascara}</code>.
        </p>
      </Paso>

      <Paso titulo="Lo que te queda">
        <p>
          La subred /{x.prefijo} tiene <strong>{formatearHosts(x.hosts)}</strong> hosts utilizables.
          {sobran > 0
            ? ` Sobran ${formatearHosts(sobran)} para crecer: con un bit menos no alcanzaba.`
            : " Calza justo: no sobra ninguno."}
        </p>
      </Paso>
    </Pasos>
  );
}
