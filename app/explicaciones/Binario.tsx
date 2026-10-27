import type { ExplicacionBinario } from "@/lib/binario";

export default function Binario({ datos: x }: { datos: ExplicacionBinario }) {
  const sumandos = x.pasos.filter((p) => p.bit === 1).map((p) => p.peso);

  return (
    <ol className="pasos">
      <li>
        <h3>Los pesos de cada bit</h3>
        <p>Cada posición de un octeto vale el doble que la de su derecha, desde 1 hasta 128.</p>
        <div className="tabla-pesos-scroll">
          <table className="tabla-pesos">
            <tbody>
              <tr>
                <th scope="row">Peso</th>
                {x.pasos.map((p) => (
                  <td key={p.peso}>{p.peso}</td>
                ))}
              </tr>
              <tr>
                <th scope="row">Bit</th>
                {x.pasos.map((p) => (
                  <td key={p.peso} className={p.bit ? "bit-uno" : "bit-cero"}>
                    {p.bit}
                  </td>
                ))}
              </tr>
              {x.sentido === "aBinario" && (
                <tr className="fila-resto">
                  <th scope="row">Queda</th>
                  {x.pasos.map((p) => (
                    <td key={p.peso}>{p.despues}</td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </li>

      <li>
        {x.sentido === "aBinario" ? (
          <>
            <h3>De izquierda a derecha, resta lo que quepa</h3>
            <p>
              Parte con {x.valor}. Si el peso cabe en lo que queda, ese bit es 1 y se resta; si no,
              es 0.
            </p>
            <ul className="restas-binario">
              {x.pasos.map((p) => (
                <li key={p.peso}>
                  {p.bit ? (
                    <>
                      {p.peso} cabe en {p.antes}: bit en <strong>1</strong>, quedan {p.antes} − {p.peso} ={" "}
                      {p.despues}.
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
          </>
        ) : (
          <>
            <h3>Suma los pesos donde hay un 1</h3>
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
          </>
        )}
      </li>
    </ol>
  );
}
