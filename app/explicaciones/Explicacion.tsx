"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { explicarBasico } from "@/lib/basico";
import { explicarBinario } from "@/lib/binario";
import { explicarHosts } from "@/lib/hosts";
import { explicarMisma } from "@/lib/misma";
import type { Ejercicio } from "@/lib/tipos";
import { explicarWildcard } from "@/lib/wildcard";
import Binario from "./Binario";
import Hosts from "./Hosts";
import Misma from "./Misma";
import Subred from "./Subred";
import Wildcard from "./Wildcard";

export function PasosDe({ ejercicio: e }: { ejercicio: Ejercicio }) {
  switch (e.tipo) {
    case "subred":
      return <Subred datos={explicarBasico(e.datos)} />;
    case "hosts":
      return <Hosts datos={explicarHosts(e.datos)} />;
    case "misma":
      return <Misma datos={explicarMisma(e.datos)} />;
    case "wildcard":
      return <Wildcard datos={explicarWildcard(e.datos)} />;
    case "binario":
      return <Binario datos={explicarBinario(e.datos)} />;
  }
}

/**
 * Explicación plegable. Se abre sola cuando hubo errores; si todo estuvo
 * bien queda cerrada, pero disponible.
 */
export default function Explicacion({ ejercicio, abierta }: { ejercicio: Ejercicio; abierta: boolean }) {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={abierta ? "explicacion" : undefined}
      className="mt-8 border-t-2 border-foreground"
    >
      <AccordionItem value="explicacion">
        <AccordionTrigger nivel={2} className="titulo py-5 text-2xl font-extrabold">Cómo se resuelve</AccordionTrigger>
        <AccordionContent>
          <PasosDe ejercicio={ejercicio} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
