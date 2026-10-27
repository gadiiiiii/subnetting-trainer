import { describe, expect, it } from "vitest";
import {
  META_DIARIA,
  PROGRESO_INICIAL,
  esProgresoValido,
  hoyLocal,
  registrarEjercicios,
  vistaProgreso,
} from "./progreso";

describe("registrarEjercicios", () => {
  it("el primer día empieza la racha en 1", () => {
    expect(registrarEjercicios(PROGRESO_INICIAL, "2026-10-27")).toEqual({
      ultimoDia: "2026-10-27",
      racha: 1,
      hechosHoy: 1,
    });
  });

  it("el mismo día suma ejercicios sin cambiar la racha", () => {
    const p = registrarEjercicios(registrarEjercicios(PROGRESO_INICIAL, "2026-10-27"), "2026-10-27", 10);
    expect(p).toEqual({ ultimoDia: "2026-10-27", racha: 1, hechosHoy: 11 });
  });

  it("el día siguiente sube la racha y reinicia los de hoy", () => {
    const p = registrarEjercicios({ ultimoDia: "2026-10-27", racha: 4, hechosHoy: 12 }, "2026-10-28");
    expect(p).toEqual({ ultimoDia: "2026-10-28", racha: 5, hechosHoy: 1 });
  });

  it("cruza fin de mes y de año", () => {
    expect(registrarEjercicios({ ultimoDia: "2026-10-31", racha: 2, hechosHoy: 1 }, "2026-11-01").racha).toBe(3);
    expect(registrarEjercicios({ ultimoDia: "2026-12-31", racha: 2, hechosHoy: 1 }, "2027-01-01").racha).toBe(3);
  });

  it("si se salta un día, la racha vuelve a 1", () => {
    expect(registrarEjercicios({ ultimoDia: "2026-10-25", racha: 9, hechosHoy: 3 }, "2026-10-27").racha).toBe(1);
  });
});

describe("vistaProgreso", () => {
  const p = { ultimoDia: "2026-10-27", racha: 3, hechosHoy: META_DIARIA };

  it("hoy muestra la racha y los ejercicios", () => {
    expect(vistaProgreso(p, "2026-10-27")).toEqual({ racha: 3, hechosHoy: META_DIARIA, metaCumplida: true });
  });

  it("al día siguiente la racha sigue viva pero los de hoy parten en 0", () => {
    expect(vistaProgreso(p, "2026-10-28")).toEqual({ racha: 3, hechosHoy: 0, metaCumplida: false });
  });

  it("dos días después la racha se perdió", () => {
    expect(vistaProgreso(p, "2026-10-29").racha).toBe(0);
  });

  it("sin historial, todo en cero", () => {
    expect(vistaProgreso(PROGRESO_INICIAL, "2026-10-27")).toEqual({ racha: 0, hechosHoy: 0, metaCumplida: false });
  });
});

describe("validación y fecha local", () => {
  it("valida lo leído del navegador", () => {
    expect(esProgresoValido({ ultimoDia: "2026-10-27", racha: 2, hechosHoy: 5 })).toBe(true);
    expect(esProgresoValido(PROGRESO_INICIAL)).toBe(true);
    expect(esProgresoValido({ ultimoDia: "27-10-2026", racha: 2, hechosHoy: 5 })).toBe(false);
    expect(esProgresoValido({ ultimoDia: null, racha: -1, hechosHoy: 0 })).toBe(false);
    expect(esProgresoValido("hola")).toBe(false);
  });

  it("formatea la fecha local", () => {
    expect(hoyLocal(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});
