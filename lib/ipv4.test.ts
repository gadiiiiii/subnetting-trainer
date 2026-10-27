import { describe, expect, it } from "vitest";
import {
  calcularSubred,
  desdeOctetos,
  direccionBroadcast,
  direccionDeRed,
  formatearIPv4,
  hostsUtilizables,
  ipBinaria,
  mascaraDesdePrefijo,
  mismaSubred,
  octetoBinario,
  octetos,
  parsearIPv4,
  prefijoDesdeMascara,
  prefijoParaHosts,
  wildcardDesdePrefijo,
  type IPv4,
} from "./ipv4";
import { crearAzar } from "./azar";

const ip = (t: string) => parsearIPv4(t)!;
const f = formatearIPv4;

/*
 * Implementación de referencia "a mano", con cadenas de 32 caracteres '0'/'1'.
 * Es lenta e ingenua a propósito: sirve para verificar la versión con
 * operadores de bits sin compartir su lógica.
 */
const referencia = {
  aBits: (n: IPv4) => n.toString(2).padStart(32, "0"),
  deBits: (b: string) => parseInt(b, 2),
  red(n: IPv4, p: number) {
    return this.deBits(this.aBits(n).slice(0, p) + "0".repeat(32 - p));
  },
  broadcast(n: IPv4, p: number) {
    return this.deBits(this.aBits(n).slice(0, p) + "1".repeat(32 - p));
  },
  mascara(p: number) {
    return this.deBits("1".repeat(p) + "0".repeat(32 - p));
  },
};

describe("parsearIPv4 y formatearIPv4", () => {
  it("lee y escribe direcciones válidas", () => {
    expect(f(ip("192.168.1.10"))).toBe("192.168.1.10");
    expect(f(ip(" 10.0.0.1 "))).toBe("10.0.0.1");
    expect(f(ip("192.168.001.010"))).toBe("192.168.1.10");
    expect(ip("0.0.0.0")).toBe(0);
    expect(ip("255.255.255.255")).toBe(0xffffffff);
  });

  it("rechaza lo que no es una dirección", () => {
    for (const t of ["", "1.2.3", "1.2.3.4.5", "256.1.1.1", "1.2.3.-4", "a.b.c.d", "1..2.3", "1.2.3.4/24", "1.2.3.0004"]) {
      expect(parsearIPv4(t), t).toBeNull();
    }
  });

  it("octetos y desdeOctetos son inversos", () => {
    expect(octetos(ip("172.16.45.130"))).toEqual([172, 16, 45, 130]);
    expect(desdeOctetos([172, 16, 45, 130])).toBe(ip("172.16.45.130"));
  });
});

describe("máscaras, prefijos y wildcards", () => {
  it("convierte prefijos conocidos", () => {
    expect(f(mascaraDesdePrefijo(0))).toBe("0.0.0.0");
    expect(f(mascaraDesdePrefijo(8))).toBe("255.0.0.0");
    expect(f(mascaraDesdePrefijo(20))).toBe("255.255.240.0");
    expect(f(mascaraDesdePrefijo(27))).toBe("255.255.255.224");
    expect(f(mascaraDesdePrefijo(32))).toBe("255.255.255.255");
    expect(f(wildcardDesdePrefijo(27))).toBe("0.0.0.31");
    expect(f(wildcardDesdePrefijo(20))).toBe("0.0.15.255");
  });

  it("ida y vuelta para los 33 prefijos, igual que la referencia", () => {
    for (let p = 0; p <= 32; p++) {
      expect(mascaraDesdePrefijo(p)).toBe(referencia.mascara(p));
      expect(prefijoDesdeMascara(mascaraDesdePrefijo(p))).toBe(p);
      expect((mascaraDesdePrefijo(p) + wildcardDesdePrefijo(p)) >>> 0).toBe(0xffffffff);
    }
  });

  it("rechaza máscaras con unos no contiguos", () => {
    expect(prefijoDesdeMascara(ip("255.255.0.255"))).toBeNull();
    expect(prefijoDesdeMascara(ip("255.0.255.0"))).toBeNull();
    expect(prefijoDesdeMascara(ip("0.0.0.255"))).toBeNull();
  });

  it("rechaza prefijos fuera de rango", () => {
    expect(() => mascaraDesdePrefijo(33)).toThrow();
    expect(() => mascaraDesdePrefijo(-1)).toThrow();
    expect(() => mascaraDesdePrefijo(24.5)).toThrow();
  });
});

describe("cálculo de subred", () => {
  it("resuelve el ejemplo clásico", () => {
    const s = calcularSubred(ip("172.16.45.130"), 27);
    expect(f(s.red)).toBe("172.16.45.128");
    expect(f(s.broadcast)).toBe("172.16.45.159");
    expect(f(s.primerHost)).toBe("172.16.45.129");
    expect(f(s.ultimoHost)).toBe("172.16.45.158");
    expect(s.hosts).toBe(30);
  });

  it("resuelve cuando el octeto interesante no es el último", () => {
    const s = calcularSubred(ip("10.45.200.17"), 13);
    expect(f(s.red)).toBe("10.40.0.0");
    expect(f(s.broadcast)).toBe("10.47.255.255");
    expect(f(s.primerHost)).toBe("10.40.0.1");
    expect(f(s.ultimoHost)).toBe("10.47.255.254");
    expect(s.hosts).toBe(524286);
  });

  it("trata /31 y /32 como casos especiales", () => {
    const s31 = calcularSubred(ip("10.0.0.5"), 31);
    expect([f(s31.primerHost), f(s31.ultimoHost), s31.hosts]).toEqual(["10.0.0.4", "10.0.0.5", 2]);
    const s32 = calcularSubred(ip("10.0.0.5"), 32);
    expect([f(s32.primerHost), f(s32.ultimoHost), s32.hosts]).toEqual(["10.0.0.5", "10.0.0.5", 1]);
  });

  it("coincide con la referencia en 20.000 casos al azar, incluidos los extremos", () => {
    const azar = crearAzar("verificacion");
    const extremos = [0, 1, 0x7fffffff, 0x80000000, 0xfffffffe, 0xffffffff];
    for (let i = 0; i < 20000; i++) {
      const n = i < extremos.length * 33 ? extremos[i % extremos.length] : azar.entero(0, 0xffffffff);
      const p = i < extremos.length * 33 ? Math.floor(i / extremos.length) : azar.entero(0, 32);
      expect(direccionDeRed(n, p)).toBe(referencia.red(n, p));
      expect(direccionBroadcast(n, p)).toBe(referencia.broadcast(n, p));
      const s = calcularSubred(n, p);
      expect(s.red <= n && n <= s.broadcast).toBe(true);
      expect(s.broadcast - s.red + 1).toBe(2 ** (32 - p));
    }
  });
});

describe("hosts", () => {
  it("calcula hosts utilizables", () => {
    expect([30, 29, 24, 16, 8].map(hostsUtilizables)).toEqual([2, 6, 254, 65534, 16777214]);
  });

  it("elige el prefijo más chico que alcanza", () => {
    expect(prefijoParaHosts(50)).toBe(26);
    expect(prefijoParaHosts(62)).toBe(26);
    expect(prefijoParaHosts(63)).toBe(25);
    expect(prefijoParaHosts(2)).toBe(31);
    expect(prefijoParaHosts(1)).toBe(32);
    expect(prefijoParaHosts(254)).toBe(24);
    expect(prefijoParaHosts(255)).toBe(23);
    expect(prefijoParaHosts(0)).toBeNull();
  });

  it("decide si dos direcciones están en la misma subred", () => {
    expect(mismaSubred(ip("192.168.1.62"), ip("192.168.1.65"), 26)).toBe(false);
    expect(mismaSubred(ip("192.168.1.62"), ip("192.168.1.1"), 26)).toBe(true);
  });
});

describe("binario", () => {
  it("formatea octetos y direcciones", () => {
    expect(octetoBinario(224)).toBe("11100000");
    expect(octetoBinario(5)).toBe("00000101");
    expect(ipBinaria(ip("192.168.1.130"))).toBe("11000000.10101000.00000001.10000010");
  });
});
