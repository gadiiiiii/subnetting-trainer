import Practica from "./Practica";
import { esSemillaValida, nuevaSemilla } from "@/lib/azar";
import { esDificultad } from "@/lib/ejercicio";
import { esSeleccion } from "@/lib/tipos";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; n?: string; s?: string }>;
}) {
  const { t, n, s } = await searchParams;
  return (
    <Practica
      // Sin tipo en la URL se asume el ejercicio de subred, para que los enlaces antiguos sigan funcionando.
      seleccionInicial={esSeleccion(t) ? t : "subred"}
      dificultadInicial={esDificultad(n) ? n : "facil"}
      semillaInicial={esSemillaValida(s) ? s : nuevaSemilla()}
    />
  );
}
