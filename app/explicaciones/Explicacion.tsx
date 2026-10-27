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

function Pasos({ ejercicio: e }: { ejercicio: Ejercicio }) {
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

export default function Explicacion({ ejercicio, titulo = "Cómo se resuelve" }: { ejercicio: Ejercicio; titulo?: string }) {
  return (
    <section className="explicacion" aria-label={titulo}>
      <h2>{titulo}</h2>
      <Pasos ejercicio={ejercicio} />
    </section>
  );
}
