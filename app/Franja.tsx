"use client";

import { CircleCheckIcon, CircleXIcon, LightbulbIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type TonoFranja = "neutro" | "correcto" | "incorrecto" | "solucion";

const ESTILO: Record<TonoFranja, string> = {
  neutro: "bg-card",
  correcto: "bg-success-soft border-success/40",
  incorrecto: "bg-destructive-soft border-destructive/40",
  solucion: "bg-card",
};

/**
 * Franja fija abajo: es donde se responde y donde llega la corrección.
 * `mensaje` y `detalle` solo aparecen después de revisar.
 */
export default function Franja({
  tono,
  mensaje,
  detalle,
  acciones,
}: {
  tono: TonoFranja;
  mensaje?: string;
  detalle?: React.ReactNode;
  acciones: React.ReactNode;
}) {
  const Icono = tono === "correcto" ? CircleCheckIcon : tono === "incorrecto" ? CircleXIcon : LightbulbIcon;
  return (
    <>
    {/* Región fija para lectores de pantalla: no se desmonta al cambiar de estado. */}
    <p className="sr-only" role="status" aria-live="polite">
      {mensaje ?? ""}
    </p>
    <div
      // La clave hace que la franja vuelva a entrar desde abajo al cambiar de estado.
      key={tono}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border shadow-franja",
        tono !== "neutro" && "animate-subir",
        ESTILO[tono],
      )}
    >
      <div className="mx-auto flex max-w-[44rem] flex-col gap-3 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-h-0 sm:min-h-12">
          {mensaje && (
            <div className="flex items-start gap-3">
              <Icono
                aria-hidden="true"
                className={cn(
                  "mt-0.5 size-7 shrink-0",
                  tono === "correcto" && "animate-pulso text-success",
                  tono === "incorrecto" && "text-destructive",
                  tono === "solucion" && "text-red",
                )}
              />
              <div>
                <p
                  className={cn(
                    "text-lg leading-7 font-bold",
                    tono === "correcto" && "text-success",
                    tono === "incorrecto" && "text-destructive",
                  )}
                >
                  {mensaje}
                </p>
                {detalle && <p className="text-sm text-muted-foreground">{detalle}</p>}
              </div>
            </div>
          )}
        </div>
        <div className="flex shrink-0 gap-3 [&>*]:flex-1 sm:[&>*]:flex-none">{acciones}</div>
      </div>
    </div>
    </>
  );
}
