import type { ExplicacionWildcard } from "@/lib/wildcard";
import TiraBits from "../TiraBits";
import { Paso, Pasos } from "./Paso";

export default function Wildcard({ datos: x }: { datos: ExplicacionWildcard }) {
  const unos = 32 - x.prefijo;
  const aWildcard = x.sentido === "aWildcard";
  return (
    <Pasos>
      {!aWildcard && (
        <Paso titulo="Cuenta los unos de la wildcard">
          <p>
            La wildcard tiene {unos} {unos === 1 ? "bit" : "bits"} en 1, que son los bits de host. El prefijo es 32 −{" "}
            {unos} = <strong>/{x.prefijo}</strong>.
          </p>
        </Paso>
      )}

      <Paso titulo="La wildcard es la máscara al revés">
        <p>
          Donde la máscara tiene 1, la wildcard tiene 0, y al revés. Un 0 en la wildcard significa «este bit tiene que
          coincidir» y un 1, «este bit no importa».
        </p>
        <TiraBits
          prefijo={x.prefijo}
          filas={[
            { etiqueta: "Máscara", bits: x.mascaraBits, decimal: x.mascara },
            { etiqueta: "Wildcard", bits: x.wildcardBits, decimal: x.wildcard, destacada: true },
          ]}
        />
      </Paso>

      <Paso titulo="En decimal: 255 menos cada octeto">
        <p>No hace falta pasar a binario: resta cada octeto {aWildcard ? "de la máscara" : "de la wildcard"} a 255.</p>
        <div className="flex flex-wrap gap-2 pt-1">
          {x.restas.map((r, i) => (
            <span
              key={i}
              className="flex min-w-22 flex-col items-center rounded-md border border-border bg-card px-3 py-2 font-mono"
            >
              <span className="text-[0.8125rem] text-muted-foreground">255 − {aWildcard ? r.mascara : r.wildcard}</span>
              <span className="text-xl font-bold text-host">{aWildcard ? r.wildcard : r.mascara}</span>
            </span>
          ))}
        </div>
        <p>
          {aWildcard ? "Wildcard" : "Máscara"}: <code>{aWildcard ? x.wildcard : x.mascara}</code>
        </p>
      </Paso>

      <Paso titulo="En el router">
        <pre className="overflow-x-auto rounded-md bg-foreground px-4 py-3 font-mono text-sm font-semibold text-background">
          {x.comando}
        </pre>
      </Paso>
    </Pasos>
  );
}
