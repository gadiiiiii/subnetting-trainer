"use client";

import { CheckIcon, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { CampoDef, Correccion, ResultadoCampo } from "@/lib/ejercicio";
import { cn } from "@/lib/utils";

function Nota({ id, r }: { id: string; r: ResultadoCampo }) {
  const ok = r.estado === "correcto";
  return (
    <p id={id} className={cn("mt-1.5 flex items-start gap-1 text-sm font-semibold", ok ? "text-success" : "text-destructive")}>
      {ok ? <CheckIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <XIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
      <span>
        {ok && "Correcto"}
        {r.estado === "vacio" && "Sin respuesta. "}
        {r.estado === "formato" && `${r.mensaje} `}
        {!ok && (
          <>
            Era <span className="font-mono text-foreground">{r.esperado}</span>
          </>
        )}
      </span>
    </p>
  );
}

/**
 * Campos de respuesta. Pueden mostrarse editables, con la corrección campo
 * por campo, o con la solución en modo solo lectura.
 */
export default function Respuestas({
  campos,
  valores,
  onCambio,
  correccion,
  soloLectura = false,
  prefijoId = "",
  primerCampo,
}: {
  campos: CampoDef[];
  valores: Record<string, string>;
  onCambio?: (id: string, valor: string) => void;
  correccion?: Correccion | null;
  soloLectura?: boolean;
  /** Para que los id no se repitan si hay varios ejercicios en la página. */
  prefijoId?: string;
  /** Recibe el primer elemento enfocable, para mover el foco al empezar. */
  primerCampo?: React.RefObject<HTMLElement | null>;
}) {
  const marcarPrimero = (i: number) => (el: HTMLElement | null) => {
    if (i === 0 && primerCampo) primerCampo.current = el;
  };

  return (
    <div className={cn("grid gap-x-5 gap-y-5", campos.length > 1 && "sm:grid-cols-2")}>
      {campos.map((c, i) => {
        const id = `${prefijoId}${c.id}`;
        const r = correccion?.[c.id];
        const valor = valores[c.id] ?? "";
        const ok = r?.estado === "correcto";

        if (c.entrada === "sino") {
          return (
            <div key={c.id} className={cn(campos.length > 1 && "sm:col-span-2")}>
              <p id={`${id}-etiqueta`} className="mb-1.5 text-sm font-semibold">
                {c.etiqueta}
              </p>
              <ToggleGroup
                type="single"
                value={valor}
                onValueChange={(v) => v && onCambio?.(c.id, v)}
                disabled={soloLectura}
                aria-labelledby={`${id}-etiqueta`}
                aria-describedby={r ? `${id}-nota` : undefined}
                className="gap-2 border-none bg-transparent p-0"
              >
                {["Sí", "No"].map((opcion, j) => (
                  <ToggleGroupItem
                    key={opcion}
                    value={opcion}
                    ref={j === 0 ? marcarPrimero(i) : undefined}
                    className={cn(
                      "h-12 min-w-24 border-2 border-border bg-card text-base text-foreground disabled:opacity-100",
                      r && valor === opcion && (ok ? "data-[state=on]:bg-success" : "data-[state=on]:bg-destructive"),
                      r && valor === opcion && "data-[state=on]:border-transparent data-[state=on]:text-white dark:data-[state=on]:text-background",
                      r?.estado === "vacio" && "border-destructive",
                    )}
                  >
                    {opcion}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              {r && <Nota id={`${id}-nota`} r={r} />}
            </div>
          );
        }

        return (
          <div key={c.id}>
            <Label htmlFor={id} className="mb-1.5">
              {c.etiqueta}
            </Label>
            <Input
              id={id}
              ref={marcarPrimero(i)}
              value={valor}
              onChange={(e) => onCambio?.(c.id, e.target.value)}
              readOnly={soloLectura}
              inputMode={c.teclado ?? "text"}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder={c.pista}
              aria-describedby={r ? `${id}-nota` : undefined}
              aria-invalid={r && !ok ? true : undefined}
              className={cn(ok && "border-success bg-success-soft")}
            />
            {r && <Nota id={`${id}-nota`} r={r} />}
          </div>
        );
      })}
    </div>
  );
}
