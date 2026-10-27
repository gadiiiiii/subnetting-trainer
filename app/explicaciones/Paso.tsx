"use client";

import { createContext, useContext } from "react";

/** Nivel de encabezado de cada paso: depende de dónde se muestre la explicación. */
export const NivelPasos = createContext<3 | 4 | 5>(3);

/** Un paso numerado de la explicación (el número lo pone el CSS de `.pasos`). */
export function Pasos({ children }: { children: React.ReactNode }) {
  return <ol className="pasos mt-2 space-y-8">{children}</ol>;
}

export function Paso({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const Titulo = `h${useContext(NivelPasos)}` as const;
  return (
    <li className="relative pt-9 sm:pt-0 sm:pl-11">
      <Titulo className="text-lg leading-7 font-bold">{titulo}</Titulo>
      <div className="mt-1.5 max-w-prose space-y-2.5 [&_strong]:font-bold">{children}</div>
    </li>
  );
}
