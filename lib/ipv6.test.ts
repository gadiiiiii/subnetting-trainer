import { describe, expect, it } from "vitest";
import { crearAzar } from "./azar";
import {
  abreviar,
  desdeGrupos,
  direccionEUI64,
  eui64,
  expandir,
  formatearMAC,
  grupos,
  idInterfaz,
  mascara6,
  parsearIPv6,
  parsearMAC,
  red6,
  secuenciaCeros,
  subredes64,
} from "./ipv6";

const ip = (t: string) => parsearIPv6(t)!;

/**
 * Referencia independiente para abreviar: el analizador de URL del propio
 * Node normaliza las direcciones IPv6 siguiendo las mismas reglas (RFC 5952).
 */
const referencia = (expandida: string) => new URL(`http://[${expandida}]/`).hostname.slice(1, -1);

describe("parsearIPv6", () => {
  it("lee la forma completa, la abreviada y con mayúsculas", () => {
    const esperado = 0x20010db8000000000000000000000001n;
    expect(ip("2001:0db8:0000:0000:0000:0000:0000:0001")).toBe(esperado);
    expect(ip("2001:db8::1")).toBe(esperado);
    expect(ip(" 2001:DB8:0:0:0:0:0:1 ")).toBe(esperado);
    expect(ip("::")).toBe(0n);
    expect(ip("::1")).toBe(1n);
    expect(ip("fe80::")).toBe(0xfe80n << 112n);
  });

  it("rechaza lo que no es una dirección IPv6", () => {
    for (const t of [
      "",
      "2001:db8::1::2",
      "2001:db8:0:0:0:0:0:0:1",
      "2001:db8:0:0:0:0:1",
      "2001:db8::g",
      "12345::1",
      "2001:db8::/64",
      "1:2:3:4:5:6:7:8::",
      "192.168.1.1",
      ":1:2:3:4:5:6:7",
    ]) {
      expect(parsearIPv6(t), t).toBeNull();
    }
  });
});

describe("expandir y abreviar", () => {
  it("resuelve los ejemplos clásicos", () => {
    expect(expandir(ip("2001:db8::1"))).toBe("2001:0db8:0000:0000:0000:0000:0000:0001");
    expect(abreviar(ip("2001:0db8:0000:0000:0000:ff00:0042:8329"))).toBe("2001:db8::ff00:42:8329");
    expect(abreviar(ip("fe80:0000:0000:0000:0202:b3ff:fe1e:8329"))).toBe("fe80::202:b3ff:fe1e:8329");
    expect(abreviar(0n)).toBe("::");
    expect(abreviar(1n)).toBe("::1");
  });

  it("no usa :: para un solo grupo en cero, y en empate elige la primera secuencia", () => {
    expect(abreviar(ip("2001:db8:0:1:1:1:1:1"))).toBe("2001:db8:0:1:1:1:1:1");
    expect(abreviar(ip("2001:0:0:1:0:0:1:1"))).toBe("2001::1:0:0:1:1");
    expect(abreviar(ip("2001:0:0:1:0:0:0:1"))).toBe("2001:0:0:1::1");
  });

  it("coincide con la referencia de Node en 20.000 direcciones con muchos ceros", () => {
    const azar = crearAzar("ipv6");
    for (let i = 0; i < 20000; i++) {
      // Grupos en cero con alta probabilidad para que aparezcan secuencias y empates.
      const g = Array.from({ length: 8 }, () => (azar.siguiente() < 0.45 ? 0 : azar.entero(1, 0xffff)));
      const x = desdeGrupos(g);
      expect(abreviar(x)).toBe(referencia(expandir(x)));
      expect(parsearIPv6(abreviar(x))).toBe(x);
      expect(parsearIPv6(expandir(x))).toBe(x);
      expect(grupos(x)).toEqual(g);
    }
  });

  it("encuentra la secuencia de ceros más larga", () => {
    expect(secuenciaCeros([1, 0, 0, 1, 0, 0, 0, 1])).toEqual({ inicio: 4, largo: 3 });
    expect(secuenciaCeros([1, 0, 1, 0, 1, 0, 1, 0])).toBeNull();
  });
});

describe("prefijos", () => {
  it("calcula la red de un prefijo", () => {
    expect(abreviar(red6(ip("2001:db8:acad:1234:5678::25"), 64))).toBe("2001:db8:acad:1234::");
    expect(abreviar(red6(ip("2001:db8:acad:1234:5678::25"), 48))).toBe("2001:db8:acad::");
    expect(abreviar(red6(ip("2001:db8:acad:12ff::1"), 56))).toBe("2001:db8:acad:1200::");
    // Prefijo que no cae en un límite de dígito hexadecimal: /62 deja 2 bits del dígito.
    expect(abreviar(red6(ip("2001:db8:acad:12f7::1"), 62))).toBe("2001:db8:acad:12f4::");
  });

  it("la máscara tiene exactamente p unos", () => {
    for (const p of [0, 1, 48, 64, 127, 128]) {
      expect(mascara6(p).toString(2).replace(/0/g, "").length).toBe(p);
    }
  });

  it("cuenta subredes /64 e ID de interfaz", () => {
    expect(subredes64(48)).toBe(65536n);
    expect(subredes64(56)).toBe(256n);
    expect(subredes64(64)).toBe(1n);
    expect(abreviar(idInterfaz(ip("2001:db8:acad:1::a:b")))).toBe("::a:b");
  });
});

describe("MAC y EUI-64", () => {
  it("lee los formatos de MAC habituales", () => {
    const esperado = [0x00, 0x1a, 0x2b, 0x3c, 0x4d, 0x5e];
    expect(parsearMAC("00:1a:2b:3c:4d:5e")).toEqual(esperado);
    expect(parsearMAC("00-1A-2B-3C-4D-5E")).toEqual(esperado);
    expect(parsearMAC("001a.2b3c.4d5e")).toEqual(esperado);
    expect(parsearMAC("00:1a:2b:3c:4d")).toBeNull();
    expect(formatearMAC(esperado, "cisco")).toBe("001a.2b3c.4d5e");
  });

  it("calcula el ID de interfaz EUI-64 (ejemplo del CCNA)", () => {
    // MAC 0019.d2a1.b2c3 → ID 0219:d2ff:fea1:b2c3 (se invierte el 7.º bit: 00 → 02)
    const mac = parsearMAC("0019.d2a1.b2c3")!;
    expect(abreviar(eui64(mac))).toBe("::219:d2ff:fea1:b2c3");
    expect(abreviar(direccionEUI64(ip("2001:db8:1:1::"), mac))).toBe("2001:db8:1:1:219:d2ff:fea1:b2c3");
    // Si el bit ya está en 1, se apaga: 02 → 00
    expect(abreviar(eui64(parsearMAC("02:00:00:00:00:01")!))).toBe("::ff:fe00:1");
  });
});
