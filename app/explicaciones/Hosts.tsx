import { formatearHosts } from "@/lib/ejercicio";
import type { ExplicacionHosts } from "@/lib/hosts";

export default function Hosts({ datos: x }: { datos: ExplicacionHosts }) {
  const sobran = x.hosts - x.necesarios;
  return (
    <ol className="pasos">
      <li>
        <h3>Cuántos bits de host necesitas</h3>
        <p>
          Con h bits de host caben 2<sup>h</sup> − 2 hosts: se restan la dirección de red y la de
          broadcast. Busca el h más chico que alcance para {formatearHosts(x.necesarios)}.
        </p>
        <table className="tabla-intentos">
          <thead>
            <tr>
              <th scope="col">Bits de host</th>
              <th scope="col">Hosts utilizables</th>
              <th scope="col">¿Alcanza?</th>
            </tr>
          </thead>
          <tbody>
            {x.intentos.map((i) => (
              <tr key={i.bits} className={i.alcanza ? "alcanza" : "no-alcanza"}>
                <td>{i.bits}</td>
                <td>
                  2<sup>{i.bits}</sup> − 2 = {formatearHosts(i.potencia)} − 2 = <strong>{formatearHosts(i.hosts)}</strong>
                </td>
                <td>{i.alcanza ? "Sí" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </li>

      <li>
        <h3>De los bits de host al prefijo</h3>
        <p>
          Prefijo = 32 − {x.bitsHost} = <strong>/{x.prefijo}</strong>. La máscara son {x.prefijo} unos
          seguidos de {x.bitsHost} ceros: <code>{x.mascara}</code>.
        </p>
      </li>

      <li>
        <h3>Lo que te queda</h3>
        <p>
          La subred /{x.prefijo} tiene <strong>{formatearHosts(x.hosts)}</strong> hosts utilizables.
          {sobran > 0
            ? ` Sobran ${formatearHosts(sobran)} para crecer: con un bit menos no alcanzaba.`
            : " Calza justo: no sobra ninguno."}
        </p>
      </li>
    </ol>
  );
}
