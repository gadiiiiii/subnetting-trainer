import { describe, expect, it } from "vitest";
import type { Correccion } from "./ejercicio";
import {
  ESTADISTICAS_VACIAS,
  ULTIMOS,
  calendario,
  esEstadisticasValidas,
  puntoDebil,
  registrarIntento,
  registrarSolucionVista,
  resumirGeneral,
  resumirTipo,
  type Estadisticas,
} from "./estadisticas";

const ok = { estado: "correcto" as const, esperado: "" };
const mal = { estado: "incorrecto" as const, esperado: "" };
const ETIQ = { mascara: "Máscara", red: "Dirección de red", broadcast: "Broadcast" };

function intento(c: Correccion, segundos: number | null = null) {
  return { tipo: "subred" as const, dificultad: "media" as const, correccion: c, etiquetas: ETIQ, segundos };
}

describe("registrarIntento", () => {
  it("acumula intentos, aciertos por campo y el día", () => {
    let e = registrarIntento(ESTADISTICAS_VACIAS, intento({ mascara: ok, red: ok, broadcast: mal }, 40), "2026-10-28");
    e = registrarIntento(e, intento({ mascara: ok, red: ok, broadcast: ok }), "2026-10-28");
    const t = e.porTipo.subred!;
    expect(t).toMatchObject({ intentos: 2, perfectos: 1, camposCorrectos: 5, camposTotales: 6, segundos: 40, cronometrados: 1 });
    expect(t.porCampo.broadcast).toEqual({ etiqueta: "Broadcast", correctos: 1, total: 2 });
    expect(t.ultimos).toEqual([0, 1]);
    expect(e.porDia).toEqual({ "2026-10-28": 2 });
  });

  it("no modifica el estado anterior", () => {
    const antes = ESTADISTICAS_VACIAS;
    registrarIntento(antes, intento({ mascara: ok }), "2026-10-28");
    expect(antes).toEqual({ version: 1, porTipo: {}, porDia: {} });
  });

  it("guarda solo los últimos resultados", () => {
    let e: Estadisticas = ESTADISTICAS_VACIAS;
    for (let i = 0; i < ULTIMOS + 5; i++) e = registrarIntento(e, intento({ mascara: i % 2 ? ok : mal }), "2026-10-28");
    expect(e.porTipo.subred!.ultimos).toHaveLength(ULTIMOS);
    expect(e.porTipo.subred!.ultimos.at(-1)).toBe(0);
  });

  it("ver la solución cuenta como ejercicio no resuelto sin tocar el porcentaje", () => {
    let e = registrarIntento(ESTADISTICAS_VACIAS, intento({ mascara: ok }), "2026-10-28");
    e = registrarSolucionVista(e, "subred", "media", "2026-10-29");
    expect(e.porTipo.subred).toMatchObject({ intentos: 2, soluciones: 1, camposCorrectos: 1, camposTotales: 1, ultimos: [1, 0] });
    expect(resumirTipo(e.porTipo.subred!).precision).toBe(100);
    expect(resumirTipo(e.porTipo.subred!).tasaPerfectos).toBe(50);
    expect(e.porDia).toEqual({ "2026-10-28": 1, "2026-10-29": 1 });
  });
});

describe("resúmenes", () => {
  it("encuentra el campo más débil con al menos 3 respuestas", () => {
    let e: Estadisticas = ESTADISTICAS_VACIAS;
    e = registrarIntento(e, intento({ mascara: ok, red: mal, broadcast: mal }, 30), "2026-10-27");
    e = registrarIntento(e, intento({ mascara: ok, red: ok, broadcast: mal }, 50), "2026-10-28");
    e = registrarIntento(e, intento({ mascara: ok, red: ok, broadcast: ok }), "2026-10-28");
    const r = resumirTipo(e.porTipo.subred!);
    expect(r.campoDebil).toEqual({ etiqueta: "Broadcast", precision: 33 });
    expect(r.precision).toBe(67);
    expect(r.segundosPromedio).toBe(40);
    expect(resumirGeneral(e)).toEqual({ ejercicios: 3, precision: 67, diasPracticados: 2 });
  });

  it("el punto débil es el tipo con menor porcentaje, con al menos 3 ejercicios", () => {
    let e: Estadisticas = ESTADISTICAS_VACIAS;
    const de = (tipo: "subred" | "wildcard" | "binario", c: Correccion) =>
      ({ tipo, dificultad: "facil" as const, correccion: c, etiquetas: {}, segundos: null });
    for (let i = 0; i < 3; i++) {
      e = registrarIntento(e, de("subred", { a: ok, b: mal }), "2026-10-28"); // 50%
      e = registrarIntento(e, de("wildcard", { a: ok, b: ok, c: mal }), "2026-10-28"); // 67%
    }
    e = registrarIntento(e, de("binario", { a: mal }), "2026-10-28"); // 0% pero solo 1 ejercicio
    expect(puntoDebil(e)?.tipo).toBe("subred");
    expect(puntoDebil(ESTADISTICAS_VACIAS)).toBeNull();
  });

  it("sin punto débil si todo está sobre 90%", () => {
    let e: Estadisticas = ESTADISTICAS_VACIAS;
    for (let i = 0; i < 5; i++) e = registrarIntento(e, intento({ mascara: ok, red: ok }), "2026-10-28");
    expect(puntoDebil(e)).toBeNull();
  });
});

describe("calendario", () => {
  it("arma semanas de lunes a domingo que terminan en la semana de hoy", () => {
    const e = { ...ESTADISTICAS_VACIAS, porDia: { "2026-10-26": 3, "2026-10-28": 10, "2026-08-01": 4 } };
    const c = calendario(e, "2026-10-28", 12); // miércoles
    expect(c).toHaveLength(12);
    expect(c.every((s) => s.length === 7)).toBe(true);
    expect(c[11][0]).toEqual({ fecha: "2026-10-26", cantidad: 3, futuro: false });
    expect(c[11][2]).toEqual({ fecha: "2026-10-28", cantidad: 10, futuro: false });
    expect(c[11][3].futuro).toBe(true);
    expect(c[0][0].fecha).toBe("2026-08-10");
  });
});

describe("validación", () => {
  it("acepta lo guardado y rechaza datos corruptos", () => {
    const e = registrarIntento(ESTADISTICAS_VACIAS, intento({ mascara: ok }), "2026-10-28");
    expect(esEstadisticasValidas(JSON.parse(JSON.stringify(e)))).toBe(true);
    expect(esEstadisticasValidas({ version: 2, porTipo: {}, porDia: {} })).toBe(false);
    expect(esEstadisticasValidas({ version: 1, porTipo: { subred: { intentos: "x" } }, porDia: {} })).toBe(false);
    expect(esEstadisticasValidas(null)).toBe(false);
  });
});
