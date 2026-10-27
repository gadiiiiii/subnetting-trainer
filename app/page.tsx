import Entrenador from "./Entrenador";
import { esSemillaValida, nuevaSemilla } from "@/lib/azar";
import { esDificultad } from "@/lib/basico";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ s?: string; n?: string }>;
}) {
  const { s, n } = await searchParams;
  return (
    <Entrenador
      semillaInicial={esSemillaValida(s) ? s : nuevaSemilla()}
      dificultadInicial={esDificultad(n) ? n : "facil"}
    />
  );
}
