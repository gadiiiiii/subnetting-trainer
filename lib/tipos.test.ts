import { crearAzar } from "./azar";
import { describe, expect, it } from "vitest";
import { explicarBinario, generarBinario, VALORES_MASCARA } from "./binario";
import {
  contarCorrectas,
  parsearBinario,
  parsearOcteto,
  parsearSiNo,
  type Dificultad,
} from "./ejercicio";
import { esMejor, formatearTiempo, generarExamen, resumirExamen } from "./examen";
import { explicarHosts, generarHosts, hostsUtilizablesClasico } from "./hosts";
import {
  calcularSubred,
  formatearIPv4,
  mismaSubred,
  parsearIPv4,
  prefijoDesdeMascara,
  wildcardDesdePrefijo,
} from "./ipv4";
import { generarMisma } from "./misma";
import {
  campos,
  corregir,
  enunciado,
  esSeleccion,
  generarEjercicio,
  solucion,
  tipoPara,
  TIPOS,
  TIPOS_IPV4,
  TIPOS_IPV6,
  type Ejercicio,
} from "./tipos";
import { explicarWildcard, generarWildcard } from "./wildcard";

const DIFICULTADES: Dificultad[] = ["facil", "media", "dificil"];

describe("todos los tipos", () => {
  for (const tipo of TIPOS) {
    for (const dificultad of DIFICULTADES) {
      it(`${tipo} (${dificultad}): reproducible, con enunciado, y su solución se corrige como correcta`, () => {
        for (let i = 0; i < 300; i++) {
          const semilla = `t${i}`;
          const e = generarEjercicio(tipo, semilla, dificultad);
          expect(generarEjercicio(tipo, semilla, dificultad)).toEqual(e);
          expect(enunciado(e).lineas.length).toBeGreaterThan(0);

          const defs = campos(e);
          const sol = solucion(e);
          expect(Object.keys(sol)).toEqual(defs.map((c) => c.id));

          const c = corregir(e, sol);
          expect(Object.keys(c)).toEqual(defs.map((d) => d.id));
          expect(contarCorrectas(c)).toBe(defs.length);

          const vacia = corregir(e, {});
          expect(Object.values(vacia).every((r) => r.estado === "vacio")).toBe(true);
        }
      });
    }
  }
});

describe("modo mixto", () => {
  it("cada mezcla usa solo sus tipos y aparecen todos", () => {
    const casos = [
      ["mixto", TIPOS_IPV4],
      ["mixto-ipv6", TIPOS_IPV6],
      ["mixto-todo", TIPOS],
    ] as const;
    for (const [mezcla, tipos] of casos) {
      const vistos = new Set<string>();
      for (let i = 0; i < 300; i++) {
        const e = generarEjercicio(mezcla, `m${i}`, "media");
        expect(e.tipo).toBe(tipoPara(mezcla, `m${i}`));
        expect(generarEjercicio(mezcla, `m${i}`, "media")).toEqual(e);
        vistos.add(e.tipo);
      }
      expect([...vistos].sort()).toEqual([...tipos].sort());
    }
  });

  it("los enlaces antiguos de mixto siguen dando el mismo tipo", () => {
    // Valores calculados con la versión anterior (solo IPv4).
    expect(["m1", "m2", "m3", "m4", "m5"].map((s) => tipoPara("mixto", s))).toEqual(
      ["m1", "m2", "m3", "m4", "m5"].map((s) => crearAzar(`mixto:${s}`).elegir(TIPOS_IPV4)),
    );
  });

  it("valida la selección que viene en la URL", () => {
    expect(esSeleccion("mixto")).toBe(true);
    expect(esSeleccion("wildcard")).toBe(true);
    expect(esSeleccion("mixto-ipv6")).toBe(true);
    expect(esSeleccion("ipv6")).toBe(false);
    expect(esSeleccion(undefined)).toBe(false);
  });
});

describe("prefijo para N hosts", () => {
  it("la respuesta es siempre la subred más chica que alcanza", () => {
    for (const dificultad of DIFICULTADES) {
      for (let i = 0; i < 1000; i++) {
        const d = generarHosts(`h${i}`, dificultad);
        const h = 32 - d.prefijo;
        expect(hostsUtilizablesClasico(h)).toBeGreaterThanOrEqual(d.necesarios);
        expect(hostsUtilizablesClasico(h - 1)).toBeLessThan(d.necesarios);
        expect(d.prefijo).toBeLessThanOrEqual(29);
      }
    }
  });

  it("explica con el intento que no alcanza y el que sí", () => {
    const x = explicarHosts({ necesarios: 50, prefijo: 26, lugar: "x" });
    expect(x.intentos).toEqual([
      { bits: 5, potencia: 32, hosts: 30, alcanza: false },
      { bits: 6, potencia: 64, hosts: 62, alcanza: true },
    ]);
    expect(x.mascara).toBe("255.255.255.192");
  });

  it("acepta el prefijo como /26, 26 o máscara", () => {
    const e: Ejercicio = { tipo: "hosts", semilla: "x", dificultad: "facil", datos: { necesarios: 50, prefijo: 26, lugar: "x" } };
    for (const p of ["/26", "26", "255.255.255.192"]) {
      expect(corregir(e, { prefijo: p }).prefijo.estado).toBe("correcto");
    }
    expect(corregir(e, { prefijo: "/25" }).prefijo.estado).toBe("incorrecto");
  });
});

describe("¿misma subred?", () => {
  it("la respuesta coincide con el cálculo y hay mitad y mitad", () => {
    let iguales = 0;
    for (const dificultad of DIFICULTADES) {
      for (let i = 0; i < 1000; i++) {
        const d = generarMisma(`m${i}`, dificultad);
        expect(mismaSubred(d.a, d.b, d.prefijo)).toBe(d.misma);
        expect(d.a).not.toBe(d.b);
        // Ninguna de las dos es dirección de red ni de broadcast.
        for (const ip of [d.a, d.b]) {
          const s = calcularSubred(ip, d.prefijo);
          expect(ip !== s.red && ip !== s.broadcast, formatearIPv4(ip)).toBe(true);
        }
        if (!d.misma) {
          // La otra está en la subred vecina, no en cualquier parte.
          const distancia = Math.abs(calcularSubred(d.a, d.prefijo).red - calcularSubred(d.b, d.prefijo).red);
          expect(distancia).toBe(2 ** (32 - d.prefijo));
        }
        if (d.misma) iguales++;
      }
    }
    expect(iguales / 3000).toBeGreaterThan(0.4);
    expect(iguales / 3000).toBeLessThan(0.6);
  });

  it("acepta Sí escrito de varias formas", () => {
    expect(["Sí", "si", "SI", " s "].map(parsearSiNo)).toEqual([true, true, true, true]);
    expect(["No", "n"].map(parsearSiNo)).toEqual([false, false]);
    expect(parsearSiNo("quizás")).toBeNull();
  });
});

describe("wildcard", () => {
  it("la red es siempre una dirección de red y la wildcard es la máscara invertida", () => {
    for (let i = 0; i < 1000; i++) {
      const d = generarWildcard(`w${i}`, "dificil");
      expect(calcularSubred(d.red, d.prefijo).red).toBe(d.red);
      const x = explicarWildcard(d);
      x.restas.forEach((r) => expect(r.mascara + r.wildcard).toBe(255));
      expect(prefijoDesdeMascara(parsearIPv4(x.mascara)!)).toBe(d.prefijo);
    }
  });

  it("arma el comando de ACL u OSPF", () => {
    const base = { red: parsearIPv4("172.16.32.0")!, prefijo: 20, sentido: "aWildcard" as const };
    expect(explicarWildcard({ ...base, uso: "acl" }).comando).toBe("access-list 10 permit 172.16.32.0 0.0.15.255");
    expect(explicarWildcard({ ...base, uso: "ospf" }).comando).toBe("network 172.16.32.0 0.0.15.255 area 0");
    expect(formatearIPv4(wildcardDesdePrefijo(20))).toBe("0.0.15.255");
  });
});

describe("binario", () => {
  it("en fácil solo usa valores de máscara, y en media siempre pide binario", () => {
    for (let i = 0; i < 500; i++) {
      expect(VALORES_MASCARA).toContain(generarBinario(`b${i}`, "facil").valor);
      expect(generarBinario(`b${i}`, "media").sentido).toBe("aBinario");
    }
  });

  it("explica la conversión restando pesos", () => {
    const x = explicarBinario({ valor: 208, sentido: "aBinario" });
    expect(x.binario).toBe("11010000");
    expect(x.pasos.map((p) => p.bit).join("")).toBe("11010000");
    expect(x.pasos[0]).toEqual({ peso: 128, bit: 1, antes: 208, despues: 80 });
    expect(x.pasos.at(-1)!.despues).toBe(0);
  });

  it("lee binario y decimal con tolerancia", () => {
    expect(parsearBinario("1101 0000")).toBe(208);
    expect(parsearBinario("11010000")).toBe(208);
    expect(parsearBinario("101")).toBe(5);
    expect(parsearBinario("110100001")).toBeNull();
    expect(parsearBinario("12")).toBeNull();
    expect(parsearOcteto("255")).toBe(255);
    expect(parsearOcteto("256")).toBeNull();
  });
});

describe("examen", () => {
  it("en mixto reparte los tipos parejo: dos de cada uno, en orden distinto según la semilla", () => {
    for (const semilla of ["a", "b", "c"]) {
      const tipos = generarExamen("mixto", "facil", semilla).map((e) => e.tipo);
      for (const t of TIPOS_IPV4) expect(tipos.filter((x) => x === t)).toHaveLength(2);
    }
    const orden = (s: string) => generarExamen("mixto", "facil", s).map((e) => e.tipo).join();
    expect(new Set(["a", "b", "c", "d"].map(orden)).size).toBeGreaterThan(1);
  });

  it("en mixto IPv6 y mixto todo reparte lo más parejo posible", () => {
    for (const semilla of ["a", "b", "c"]) {
      const v6 = generarExamen("mixto-ipv6", "media", semilla).map((e) => e.tipo);
      for (const t of TIPOS_IPV6) expect(v6.filter((x) => x === t).length).toBeGreaterThanOrEqual(3);
      const todo = generarExamen("mixto-todo", "media", semilla).map((e) => e.tipo);
      for (const t of TIPOS) expect(todo.filter((x) => x === t).length).toBeGreaterThanOrEqual(1);
    }
  });

  it("con un solo tipo, todos los ejercicios son de ese tipo", () => {
    expect(generarExamen("wildcard", "media", "x").every((e) => e.tipo === "wildcard")).toBe(true);
  });

  it("genera 10 ejercicios reproducibles y distintos entre sí", () => {
    const a = generarExamen("mixto", "media", "clase1");
    expect(a).toHaveLength(10);
    expect(generarExamen("mixto", "media", "clase1")).toEqual(a);
    expect(new Set(a.map((e) => JSON.stringify(e.datos))).size).toBe(10);
  });

  it("resume puntaje y tiempo", () => {
    const ok = { estado: "correcto" as const, esperado: "x" };
    const mal = { estado: "incorrecto" as const, esperado: "x" };
    const r = resumirExamen([
      { correccion: { a: ok, b: ok }, segundos: 30 },
      { correccion: { a: ok, b: mal, c: mal }, segundos: 45 },
    ]);
    expect(r).toEqual({
      camposCorrectos: 3,
      camposTotales: 5,
      perfectos: 1,
      ejercicios: 2,
      segundosTotales: 75,
      segundosPromedio: 38,
      porcentaje: 60,
    });
  });

  it("compara récords: gana el porcentaje y después el tiempo", () => {
    const r = resumirExamen([{ correccion: { a: { estado: "correcto", esperado: "" } }, segundos: 50 }]);
    expect(esMejor(r, null)).toBe(true);
    expect(esMejor(r, { porcentaje: 90, segundosTotales: 10 })).toBe(true);
    expect(esMejor(r, { porcentaje: 100, segundosTotales: 60 })).toBe(true);
    expect(esMejor(r, { porcentaje: 100, segundosTotales: 40 })).toBe(false);
  });

  it("formatea tiempos", () => {
    expect([0, 5, 65, 600, 3725].map(formatearTiempo)).toEqual(["0:00", "0:05", "1:05", "10:00", "1:02:05"]);
  });
});
