import type { Enunciado } from "@/lib/ejercicio";

export default function EnunciadoVista({ enunciado, id }: { enunciado: Enunciado; id?: string }) {
  const varias = enunciado.lineas.length > 1;
  return (
    <>
      <h1 id={id} className={varias ? "varias" : undefined}>
        <span className="enunciado-texto">{enunciado.pregunta}</span>
        {enunciado.lineas.map((l, i) => (
          <span key={i} className="direccion">
            {l.etiqueta && <span className="direccion-etiqueta">{l.etiqueta}</span>}
            <span>
              {l.valor}
              {l.acento && <span className="prefijo">{l.acento}</span>}
            </span>
          </span>
        ))}
      </h1>
      {enunciado.nota && <p className="enunciado-nota">{enunciado.nota}</p>}
    </>
  );
}
