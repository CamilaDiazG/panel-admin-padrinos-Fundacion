import { describe, expect, it } from "vitest";
import { accumulatedDonations, annualCommitment, donationSchema, donationsForYear, monthlyDonations, type Donation } from "@/lib/donativos";

const movements: Donation[] = [
  { id: "1", padrino_id: "p1", fecha: "2026-01-10", monto: 500, metodo_pago: "transferencia", quincena: "primera", referencia: "", comentarios: "", estatus: "registrado", created_at: "2026-01-10T12:00:00Z" },
  { id: "2", padrino_id: "p1", fecha: "2026-02-20", monto: 700, metodo_pago: "efectivo", quincena: "segunda", referencia: "", comentarios: "", estatus: "registrado", created_at: "2026-02-20T12:00:00Z" },
  { id: "3", padrino_id: "p2", fecha: "2026-02-25", monto: 900, metodo_pago: "deposito", quincena: "segunda", referencia: "", comentarios: "", estatus: "cancelado", created_at: "2026-02-25T12:00:00Z" },
  { id: "4", padrino_id: "p1", fecha: "2025-12-20", monto: 300, metodo_pago: "transferencia", quincena: "segunda", referencia: "", comentarios: "", estatus: "registrado", created_at: "2025-12-20T12:00:00Z" },
];

describe("control de donativos", () => {
  it("valida movimientos positivos con padrino y fecha", () => {
    expect(donationSchema.safeParse({ padrino_id: "p1", fecha: "2026-09-16", monto: 1000, metodo_pago: "transferencia", quincena: "segunda", referencia: "TR-100", comentarios: "" }).success).toBe(true);
    expect(donationSchema.safeParse({ padrino_id: "", fecha: "2026-09-16", monto: 0, metodo_pago: "transferencia", quincena: "segunda", referencia: "", comentarios: "" }).success).toBe(false);
  });

  it("exige folio únicamente para transferencias y depósitos", () => {
    const base = { padrino_id: "p1", fecha: "2026-09-16", monto: 1000, quincena: "segunda" as const, referencia: "", comentarios: "" };
    expect(donationSchema.safeParse({ ...base, metodo_pago: "transferencia" }).success).toBe(false);
    expect(donationSchema.safeParse({ ...base, metodo_pago: "deposito" }).success).toBe(false);
    expect(donationSchema.safeParse({ ...base, metodo_pago: "efectivo" }).success).toBe(true);
    expect(donationSchema.safeParse({ ...base, metodo_pago: "tarjeta" }).success).toBe(true);
    expect(donationSchema.parse({ ...base, metodo_pago: "efectivo", referencia: "NO-DEBE-GUARDARSE" }).referencia).toBe("");
  });

  it("calcula el compromiso anual según la periodicidad", () => {
    expect(annualCommitment({ aportacion: 800, periodicidad: "mensual" })).toBe(9600);
    expect(annualCommitment({ aportacion: 12000, periodicidad: "trimestral" })).toBe(48000);
    expect(annualCommitment({ aportacion: 200000, periodicidad: "anual" })).toBe(200000);
  });

  it("filtra por año y excluye movimientos cancelados", () => {
    expect(donationsForYear(movements, 2026).map((item) => item.id)).toEqual(["1", "2"]);
    expect(accumulatedDonations(movements, 2026)).toBe(1200);
    expect(accumulatedDonations(movements, 2025)).toBe(300);
  });

  it("agrupa los importes por mes y padrino", () => {
    const monthly = monthlyDonations(movements, 2026, "p1");
    expect(monthly[0]).toBe(500);
    expect(monthly[1]).toBe(700);
    expect(monthly.slice(2).every((value) => value === 0)).toBe(true);
  });
});
