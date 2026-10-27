import { describe, expect, it } from "vitest";
import {
  CAMPOS,
  contarCorrectas,
  corregirBasico,
  explicarBasico,
  generarBasico,
  parsearHosts,
  parsearMascara,
  solucionBasico,
  type Dificultad,
  type EjercicioBasico,
} from "./basico";
import { calcularSubred, formatearIPv4, octetos, parsearIPv4 } from "./ipv4";

const ejercicio = (ip: string, prefijo: number): EjercicioBasico => ({
  semilla: "test",
  dificultad: "facil",
  ip: parsearIPv4(ip)!,
  prefijo,
});

describe("generarBasico", () => {
  it("es reproducible: la misma semilla da el mismo ejercicio", () => {
    expect(generarBasico("abc123", "media")).toEqual(generarBasico("abc123", "media"));
    expect(generarBasico("abc123", "media")).not.toEqual(generarBasico("abc124", "media"));
  });

  it("la dificultad cambia el ejercicio aunque la semilla sea la misma", () => {
    expect(generarBasico("abc123", "facil").ip).not.toBe(generarBasico("abc123", "dificil").ip);
  });

  const reglas: Record<Dificultad, (o: number[], p: number) => boolean> = {
    facil: (o, p) => o[0] === 192 && o[1] === 168 && p >= 24 && p <= 30,
    media: (o, p) => o[0] === 172 && o[1] >= 16 && o[1] <= 31 && p >= 16 && p <= 30,
    dificil: (o, p) => o[0] >= 1 && o[0] <= 223 && o[0] !== 127 && p >= 8 && p <= 30,
  };

  for (const dificultad of Object.keys(reglas) as Dificultad[]) {
    it(`en ${dificultad}, respeta el rango y nunca pide la red ni el broadcast`, () => {
      const prefijos = new Set<number>();
      for (let i = 0; i < 2000; i++) {
        const e = generarBasico(`s${i}`, dificultad);
        const s = calcularSubred(e.ip, e.prefijo);
        expect(reglas[dificultad](octetos(e.ip), e.prefijo), formatearIPv4(e.ip)).toBe(true);
        expect(e.ip).not.toBe(s.red);
        expect(e.ip).not.toBe(s.broadcast);
        prefijos.add(e.prefijo);
      }
      // Con 2000 ejercicios deberían aparecer todos los prefijos del rango.
      const [min, max] = { facil: [24, 30], media: [16, 30], dificil: [8, 30] }[dificultad];
      expect(prefijos.size).toBe(max - min + 1);
    });
  }
});

describe("parseo de respuestas", () => {
  it("acepta hosts con separadores de miles", () => {
    expect(parsearHosts("30")).toBe(30);
    expect(parsearHosts("524.286")).toBe(524286);
    expect(parsearHosts("524 286")).toBe(524286);
    expect(parsearHosts("30 hosts")).toBe(30);
    expect(parsearHosts("treinta")).toBeNull();
    expect(parsearHosts("-30")).toBeNull();
  });

  it("acepta máscaras en decimal o como prefijo", () => {
    expect(parsearMascara("255.255.255.224")).toBe(parsearIPv4("255.255.255.224"));
    expect(parsearMascara("/27")).toBe(parsearIPv4("255.255.255.224"));
    expect(parsearMascara("27")).toBe(parsearIPv4("255.255.255.224"));
    expect(parsearMascara("255.255.0.255")).toBeNull();
    expect(parsearMascara("/33")).toBeNull();
  });
});

describe("corregirBasico", () => {
  const e = ejercicio("172.16.45.130", 27);

  it("da todo por correcto con la solución", () => {
    const c = corregirBasico(e, solucionBasico(e));
    expect(contarCorrectas(c)).toBe(6);
  });

  it("acepta variantes de formato equivalentes", () => {
    const c = corregirBasico(e, {
      mascara: "/27",
      red: "172.016.045.128",
      broadcast: " 172.16.45.159 ",
      primerHost: "172.16.45.129",
      ultimoHost: "172.16.45.158",
      hosts: "30 hosts",
    });
    expect(contarCorrectas(c)).toBe(6);
  });

  it("distingue incorrecto, vacío y mal formateado, y siempre informa lo esperado", () => {
    const c = corregirBasico(e, {
      mascara: "255.255.255.240",
      red: "",
      broadcast: "172.16.45",
      primerHost: "172.16.45.128",
      ultimoHost: "172.16.45.158",
      hosts: "32",
    });
    expect(c.mascara).toEqual({ estado: "incorrecto", esperado: "255.255.255.224" });
    expect(c.red).toEqual({ estado: "vacio", esperado: "172.16.45.128" });
    expect(c.broadcast.estado).toBe("formato");
    expect(c.primerHost).toEqual({ estado: "incorrecto", esperado: "172.16.45.129" });
    expect(c.ultimoHost.estado).toBe("correcto");
    expect(c.hosts).toEqual({ estado: "incorrecto", esperado: "30" });
    expect(contarCorrectas(c)).toBe(1);
  });

  it("formatea con separador de miles los hosts esperados", () => {
    expect(solucionBasico(ejercicio("10.45.200.17", 13)).hosts).toBe("524.286");
  });

  it("corrige bien todos los campos en 1000 ejercicios generados", () => {
    for (let i = 0; i < 1000; i++) {
      const g = generarBasico(`c${i}`, "dificil");
      const c = corregirBasico(g, solucionBasico(g));
      for (const campo of CAMPOS) expect(c[campo].estado).toBe("correcto");
    }
  });
});

describe("explicarBasico", () => {
  it("explica el octeto interesante con el tamaño de bloque", () => {
    const x = explicarBasico(ejercicio("172.16.45.130", 27));
    expect(x.bitsHost).toBe(5);
    expect(x.octetosCompletos).toBe(3);
    expect(x.octetoInteresante).toEqual({
      posicion: 4,
      valorIp: 130,
      valorMascara: 224,
      bloque: 32,
      cociente: 4,
      inicio: 128,
      fin: 159,
    });
    expect(x.mascaraBits).toBe("1".repeat(27) + "0".repeat(5));
  });

  it("explica cuando el octeto interesante no es el último", () => {
    const x = explicarBasico(ejercicio("10.45.200.17", 13));
    expect(x.octetoInteresante).toMatchObject({ posicion: 2, valorIp: 45, valorMascara: 248, bloque: 8, inicio: 40, fin: 47 });
  });

  it("no hay octeto interesante si el prefijo es múltiplo de 8", () => {
    const x = explicarBasico(ejercicio("172.20.9.77", 16));
    expect(x.octetoInteresante).toBeNull();
    expect(x.octetosCompletos).toBe(2);
    expect(x.solucion.red).toBe("172.20.0.0");
  });

  it("el atajo decimal coincide con el cálculo en binario en 2000 ejercicios", () => {
    for (let i = 0; i < 2000; i++) {
      const g = generarBasico(`x${i}`, "dificil");
      const x = explicarBasico(g);
      const s = calcularSubred(g.ip, g.prefijo);
      if (x.octetoInteresante) {
        const i0 = x.octetoInteresante.posicion - 1;
        expect(octetos(s.red)[i0]).toBe(x.octetoInteresante.inicio);
        expect(octetos(s.broadcast)[i0]).toBe(x.octetoInteresante.fin);
      }
      expect(parseInt(x.redBits, 2)).toBe(s.red);
    }
  });
});
