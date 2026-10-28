"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { NOMBRE_DIFICULTAD, type Dificultad } from "@/lib/ejercicio";
import { MEZCLAS, TIPOS_IPV4, TIPOS_IPV6, nombreSeleccion, type Seleccion } from "@/lib/tipos";

/** Tipo de ejercicio y dificultad en una fila; `children` agrega controles a la derecha. */
export default function SelectorEjercicio({
  seleccion,
  dificultad,
  onSeleccion,
  onDificultad,
  children,
}: {
  seleccion: Seleccion;
  dificultad: Dificultad;
  onSeleccion: (s: Seleccion) => void;
  onDificultad: (d: Dificultad) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <Select value={seleccion} onValueChange={(v) => v !== seleccion && onSeleccion(v as Seleccion)}>
        <SelectTrigger aria-label="Tipo de ejercicio" className="min-w-60">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(
            [
              ["IPv4", TIPOS_IPV4],
              ["IPv6", TIPOS_IPV6],
              ["Mezclas", MEZCLAS],
            ] as const
          ).map(([grupo, opciones], i) => (
            <SelectGroup key={grupo}>
              {i > 0 && <SelectSeparator />}
              <SelectLabel>{grupo}</SelectLabel>
              {opciones.map((t) => (
                <SelectItem key={t} value={t}>
                  {nombreSeleccion(t)}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>

      <ToggleGroup
        type="single"
        value={dificultad}
        onValueChange={(v) => v && v !== dificultad && onDificultad(v as Dificultad)}
        aria-label="Dificultad"
      >
        {(Object.keys(NOMBRE_DIFICULTAD) as Dificultad[]).map((d) => (
          <ToggleGroupItem key={d} value={d}>
            {NOMBRE_DIFICULTAD[d]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {children}
    </div>
  );
}
