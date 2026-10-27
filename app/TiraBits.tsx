/**
 * Una dirección de 32 bits dibujada bit por bit, separada en octetos.
 * Los bits de red se tiñen de naranjo y los de host de azul, con una línea
 * en el límite que marca el prefijo.
 */

export interface FilaBits {
  etiqueta: string;
  bits: string;
  decimal: string;
  destacada?: boolean;
}

export default function TiraBits({ filas, prefijo }: { filas: FilaBits[]; prefijo: number }) {
  return (
    <div className="tira" role="table" aria-label={`Direcciones en binario, prefijo /${prefijo}`}>
      {filas.map((fila) => (
        <div key={fila.etiqueta} className={`tira-fila${fila.destacada ? " destacada" : ""}`} role="row">
          <span className="tira-etiqueta" role="rowheader">
            {fila.etiqueta}
          </span>
          <span className="tira-bits" role="cell" aria-label={fila.bits.match(/.{8}/g)!.join(".")}>
            {[0, 1, 2, 3].map((o) => (
              <span key={o} className="tira-octeto" aria-hidden="true">
                {fila.bits
                  .slice(o * 8, o * 8 + 8)
                  .split("")
                  .map((b, i) => {
                    const pos = o * 8 + i;
                    const clase = [
                      "bit",
                      pos < prefijo ? "bit-red" : "bit-host",
                      pos === prefijo - 1 && prefijo % 8 !== 0 ? "bit-limite" : "",
                    ]
                      .filter(Boolean)
                      .join(" ");
                    return (
                      <span key={i} className={clase}>
                        {b}
                      </span>
                    );
                  })}
              </span>
            ))}
          </span>
          <span className="tira-decimal" role="cell">
            {fila.decimal}
          </span>
        </div>
      ))}
    </div>
  );
}
