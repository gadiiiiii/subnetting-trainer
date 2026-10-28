import type { Metadata } from "next";
import Progreso from "./Progreso";

export const metadata: Metadata = {
  title: "Tu progreso en subnetting",
  description: "Porcentaje de respuestas correctas por tipo de ejercicio, tu punto débil y los días que practicaste.",
};

export default function Page() {
  return <Progreso />;
}
