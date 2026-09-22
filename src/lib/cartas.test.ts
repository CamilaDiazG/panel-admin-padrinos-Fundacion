import { describe, expect, it } from "vitest";
import { cartaSchema, validateCartaFile } from "@/lib/cartas";

const valid = {
  padrino_id: "p1",
  anio: 2026,
  paciente_nombre: "Paciente de prueba",
  deseo_1: "Libro",
  deseo_2: "Rompecabezas",
  deseo_3: "Balón",
  medio_envio: "whatsapp" as const,
  estado: "pendiente" as const,
  fecha_envio: "",
  observaciones: "",
};

describe("cartas navideñas", () => {
  it("exige los tres regalos", () => {
    expect(cartaSchema.safeParse(valid).success).toBe(true);
    expect(cartaSchema.safeParse({ ...valid, deseo_3: "" }).success).toBe(false);
  });

  it("exige fecha cuando la carta ya fue enviada", () => {
    expect(cartaSchema.safeParse({ ...valid, estado: "enviada" }).success).toBe(false);
    expect(cartaSchema.safeParse({ ...valid, estado: "enviada", fecha_envio: "2026-11-20" }).success).toBe(true);
  });

  it("acepta únicamente escaneos compatibles de hasta 10 MB", () => {
    expect(validateCartaFile({ name: "carta.pdf", size: 5000, type: "application/pdf" })).toBeNull();
    expect(validateCartaFile({ name: "carta.exe", size: 5000, type: "application/octet-stream" })).toBeTruthy();
    expect(validateCartaFile({ name: "carta.png", size: 11 * 1024 * 1024, type: "image/png" })).toBeTruthy();
  });
});
