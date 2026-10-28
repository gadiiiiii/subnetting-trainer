import { describe, expect, it } from "vitest";
import { explicarAbreviar, generarAbreviar, tipoAbreviar } from "./abreviar6";
import { explicarEUI64, generarEUI64, tipoEUI64 } from "./eui64";
import { abreviar, grupos, parsearIPv6, parsearMAC, red6, secuenciaCeros } from "./ipv6";
import { formatearInterfaz, parsearInterfaz } from "./ipv6Comun";
import { explicarPrefijo6, generarPrefijo6, tipoPrefijo6 } from "./prefijo6";

const ip = (t: string) => parsearIPv6(t)!;

describe("abreviar y expandir", () => {
  const abreviarEj = { ip: ip("2001:0db8:0000:0000:0000:ff00:0042:8329"), sentido: "abreviar" as const };
  const expandirEj = { ...abreviarEj, sentido: "expandir" as const };

  it("acepta la forma más corta, sin importar mayúsculas", () => {
    expect(tipoAbreviar.corregir(abreviarEj, { abreviada: "2001:DB8::FF00:42:8329" }).abreviada.estado).toBe("correcto");
  });

  it("si es la misma dirección pero no está al mínimo, lo explica", () => {
    const r = tipoAbreviar.corregir(abreviarEj, { abreviada: "2001:db8:0:0:0:ff00:42:8329" }).abreviada;
    expect(r).toMatchObject({ estado: "formato", mensaje: "Es la misma dirección, pero se puede abreviar más." });
    const e = tipoAbreviar.corregir(expandirEj, { completa: "2001:db8::ff00:42:8329" }).completa;
    expect(e.estado).toBe("formato");
  });

  it("distingue otra dirección y texto inválido", () => {
    expect(tipoAbreviar.corregir(abreviarEj, { abreviada: "2001:db8::ff00:42:832a" }).abreviada.estado).toBe("incorrecto");
    expect(tipoAbreviar.corregir(abreviarEj, { abreviada: "2001::db8::1" }).abreviada.estado).toBe("formato");
  });

  it("en difícil siempre hay dos secuencias de ceros para elegir", () => {
    for (let i = 0; i < 500; i++) {
      const x = explicarAbreviar(generarAbreviar(`d${i}`, "dificil"));
      expect(x.secuencia).not.toBeNull();
      expect(x.otras.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("en fácil hay exactamente una secuencia de ceros", () => {
    for (let i = 0; i < 500; i++) {
      const g = grupos(generarAbreviar(`f${i}`, "facil").ip);
      const s = secuenciaCeros(g)!;
      const ceros = g.filter((v) => v === 0).length;
      expect(ceros).toBe(s.largo);
    }
  });
});

describe("prefijo de red", () => {
  const ej64 = { ip: ip("2001:db8:acad:1234:5678::25"), prefijo: 64 };

  it("acepta la red en cualquier forma, con o sin /64", () => {
    for (const red of ["2001:db8:acad:1234::", "2001:db8:acad:1234::/64", "2001:0db8:acad:1234:0:0:0:0"]) {
      expect(tipoPrefijo6.corregir(ej64, { red }).red.estado, red).toBe("correcto");
    }
  });

  it("acepta el ID de interfaz como 4 grupos o con ::", () => {
    for (const interfaz of ["5678:0:0:25", "5678::25", "5678:0000:0000:0025", "::5678:0:0:25"]) {
      expect(tipoPrefijo6.corregir(ej64, { interfaz }).interfaz.estado, interfaz).toBe("correcto");
    }
    expect(formatearInterfaz(parsearInterfaz("5678::25")!)).toBe("5678:0:0:25");
  });

  it("pide subredes /64 cuando el prefijo es más corto", () => {
    const ej48 = { ip: ip("2001:db8:acad:1234::1"), prefijo: 48 };
    expect(tipoPrefijo6.campos(ej48).map((c) => c.id)).toEqual(["red", "subredes"]);
    expect(tipoPrefijo6.corregir(ej48, { subredes: "65.536" }).subredes.estado).toBe("correcto");
    expect(explicarPrefijo6(ej48).red).toBe("2001:db8:acad::/48");
  });

  it("explica el corte cuando el prefijo parte un dígito hexadecimal", () => {
    const x = explicarPrefijo6({ ip: ip("2001:db8:acad:12f7::1"), prefijo: 62 });
    expect(x.corte).toEqual({ grupo: 3, digito: 3, bitsDeRed: 2, valor: 7, queda: 4 });
    expect(x.red).toBe("2001:db8:acad:12f4::/62");
  });

  it("la dirección nunca es la red misma, y respeta los rangos de prefijo", () => {
    for (const [dif, min, max] of [["facil", 64, 64], ["media", 32, 64], ["dificil", 33, 63]] as const) {
      for (let i = 0; i < 500; i++) {
        const d = generarPrefijo6(`p${i}`, dif);
        expect(d.prefijo).toBeGreaterThanOrEqual(min);
        expect(d.prefijo).toBeLessThanOrEqual(max);
        expect(d.ip).not.toBe(red6(d.ip, d.prefijo));
      }
    }
  });
});

describe("EUI-64", () => {
  it("resuelve el ejemplo del CCNA y acepta el ID con o sin ceros", () => {
    const d = { prefijo: ip("2001:db8:1:1::"), mac: parsearMAC("0019.d2a1.b2c3")!, formato: "cisco" as const };
    expect(explicarEUI64(d)).toMatchObject({ interfaz: "219:d2ff:fea1:b2c3", direccion: "2001:db8:1:1:219:d2ff:fea1:b2c3" });
    const c = tipoEUI64.corregir(d, { interfaz: "0219:d2ff:fea1:b2c3", direccion: "2001:DB8:1:1:219:D2FF:FEA1:B2C3" });
    expect([c.interfaz.estado, c.direccion.estado]).toEqual(["correcto", "correcto"]);
  });

  it("detecta el error típico: no invertir el séptimo bit", () => {
    const d = { prefijo: ip("2001:db8:1:1::"), mac: parsearMAC("0019.d2a1.b2c3")!, formato: "cisco" as const };
    expect(tipoEUI64.corregir(d, { interfaz: "19:d2ff:fea1:b2c3" }).interfaz.estado).toBe("incorrecto");
  });

  it("genera MAC unicast y prefijos /64 limpios", () => {
    for (const dif of ["facil", "media", "dificil"] as const) {
      for (let i = 0; i < 300; i++) {
        const d = generarEUI64(`e${i}`, dif);
        expect(d.mac[0] & 1).toBe(0);
        expect(red6(d.prefijo, 64)).toBe(d.prefijo);
        if (dif === "facil") expect(d.mac[0]).toBe(0);
      }
    }
    expect(abreviar(ip("2001:db8::"))).toBe("2001:db8::");
  });
});
