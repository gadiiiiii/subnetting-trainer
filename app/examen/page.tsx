import type { Metadata } from "next";
import Examen from "./Examen";
import { esSemillaValida, nuevaSemilla } from "@/lib/azar";
import { esDificultad } from "@/lib/ejercicio";
import { esSeleccion } from "@/lib/tipos";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Examen de subnetting",
  description: "10 ejercicios de subnetting con cronómetro. Comparte el enlace y todos reciben el mismo examen.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; n?: string; s?: string }>;
}) {
  const { t, n, s } = await searchParams;
  return (
    <Examen
      seleccionInicial={esSeleccion(t) ? t : "mixto"}
      dificultadInicial={esDificultad(n) ? n : "media"}
      semillaInicial={esSemillaValida(s) ? s : nuevaSemilla()}
    />
  );
}
