import Link from "next/link";

export default function Navegacion({ actual }: { actual: "practica" | "examen" }) {
  return (
    <header className="cabecera">
      <p className="marca">Entrenador de subnetting</p>
      <nav className="modos" aria-label="Modo">
        <Link href="/" aria-current={actual === "practica" ? "page" : undefined}>
          Práctica
        </Link>
        <Link href="/examen" aria-current={actual === "examen" ? "page" : undefined}>
          Examen
        </Link>
      </nav>
    </header>
  );
}
