import { describe, expect, it } from "vitest";
import { DEMO_PADRINOS } from "@/lib/demo-data";
import { isDuplicate, monthlyEquivalent, normalizePadrino, padrinoDefaults, padrinoSchema } from "@/lib/padrinos";

describe("modelo de padrinos", () => {
  it("exige nombre para una persona y razón social para una empresa", () => {
    expect(padrinoSchema.safeParse({ ...padrinoDefaults, email: "a@b.com", telefono: "3312345678", codigo_postal: "45019" }).success).toBe(false);
    expect(padrinoSchema.safeParse({ ...padrinoDefaults, tipo: "empresa", razon_social: "Empresa ejemplo", email: "a@b.com", telefono: "3312345678", codigo_postal: "45019" }).success).toBe(true);
  });

  it("normaliza correo, RFC y teléfonos", () => {
    const result = normalizePadrino({ ...padrinoDefaults, nombres: " Ana ", apellido_paterno: "Díaz", email: " ANA@Ejemplo.COM ", rfc: " diaa 900101ab1 ", telefono: "(33) 1234-5678", codigo_postal: "45019" });
    expect(result.email).toBe("ana@ejemplo.com");
    expect(result.rfc).toBe("DIAA900101AB1");
    expect(result.telefono).toBe("3312345678");
  });

  it("calcula el equivalente mensual", () => {
    expect(monthlyEquivalent({ aportacion: 1200, periodicidad: "anual" })).toBe(100);
    expect(monthlyEquivalent({ aportacion: 900, periodicidad: "trimestral" })).toBe(300);
    expect(monthlyEquivalent({ aportacion: 5000, periodicidad: "unica" })).toBe(0);
  });

  it("detecta RFC o correo duplicado sin marcar el mismo registro", () => {
    const candidate = { ...padrinoDefaults, nombres: "Otra", apellido_paterno: "Persona", email: DEMO_PADRINOS[0].email.toUpperCase(), codigo_postal: "45019", telefono: "3312345678" };
    expect(isDuplicate(candidate, DEMO_PADRINOS)?.id).toBe(DEMO_PADRINOS[0].id);
    expect(isDuplicate(candidate, DEMO_PADRINOS, DEMO_PADRINOS[0].id)).toBeUndefined();
  });
});
