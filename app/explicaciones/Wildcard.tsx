import type { ExplicacionWildcard } from "@/lib/wildcard";
import TiraBits from "../TiraBits";

export default function Wildcard({ datos: x }: { datos: ExplicacionWildcard }) {
  const unos = 32 - x.prefijo;
  return (
    <ol className="pasos">
      {x.sentido === "aPrefijo" && (
        <li>
          <h3>Cuenta los unos de la wildcard</h3>
          <p>
            La wildcard tiene {unos} {unos === 1 ? "bit" : "bits"} en 1, que son los bits de host. El
            prefijo es 32 − {unos} = <strong>/{x.prefijo}</strong>.
          </p>
        </li>
      )}

      <li>
        <h3>La wildcard es la máscara al revés</h3>
        <p>
          Donde la máscara tiene 1, la wildcard tiene 0, y al revés. Un 0 en la wildcard significa
          «este bit tiene que coincidir» y un 1, «este bit no importa».
        </p>
        <TiraBits
          prefijo={x.prefijo}
          filas={[
            { etiqueta: "Máscara", bits: x.mascaraBits, decimal: x.mascara },
            { etiqueta: "Wildcard", bits: x.wildcardBits, decimal: x.wildcard, destacada: true },
          ]}
        />
      </li>

      <li>
        <h3>En decimal: 255 menos cada octeto</h3>
        <p>No hace falta pasar a binario: resta cada octeto {x.sentido === "aWildcard" ? "de la máscara" : "de la wildcard"} a 255.</p>
        <div className="restas">
          {x.restas.map((r, i) => (
            <span key={i} className="resta">
              <span className="resta-operacion">
                255 − {x.sentido === "aWildcard" ? r.mascara : r.wildcard}
              </span>
              <span className="resta-resultado">{x.sentido === "aWildcard" ? r.wildcard : r.mascara}</span>
            </span>
          ))}
        </div>
        <p>
          {x.sentido === "aWildcard" ? "Wildcard" : "Máscara"}:{" "}
          <code>{x.sentido === "aWildcard" ? x.wildcard : x.mascara}</code>
        </p>
      </li>

      <li>
        <h3>En el router</h3>
        <pre className="comando">
          <code>{x.comando}</code>
        </pre>
      </li>
    </ol>
  );
}
