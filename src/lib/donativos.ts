import { z } from "zod";
import type { Padrino } from "@/lib/padrinos";

export const donationSchema = z.object({
  padrino_id: z.string().min(1, "Selecciona un padrino"),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona una fecha"),
  monto: z.coerce.number().positive("El monto debe ser mayor a cero").max(100000000),
  metodo_pago: z.enum(["transferencia", "tarjeta", "efectivo", "deposito", "otro"]),
  quincena: z.enum(["primera", "segunda", "no_aplica"]),
  referencia: z.string().trim().max(100).default(""),
  comentarios: z.string().trim().max(1000).default(""),
}).superRefine((data, ctx) => {
  if ((data.metodo_pago === "transferencia" || data.metodo_pago === "deposito") && !data.referencia) {
    ctx.addIssue({ code: "custom", path: ["referencia"], message: "El folio es obligatorio para este método" });
  }
}).transform((data) => ({
  ...data,
  referencia: data.metodo_pago === "transferencia" || data.metodo_pago === "deposito" ? data.referencia : "",
}));

export type DonationInput = z.infer<typeof donationSchema>;

export interface Donation extends DonationInput {
  id: string;
  estatus: "registrado" | "cancelado";
  created_at: string;
  cancelled_at?: string | null;
}

export const donationDefaults: DonationInput = {
  padrino_id: "",
  fecha: new Date().toISOString().slice(0, 10),
  monto: 0,
  metodo_pago: "transferencia",
  quincena: "no_aplica",
  referencia: "",
  comentarios: "",
};

export const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"] as const;

export function donationYear(donation: Pick<Donation, "fecha">): number {
  return Number(donation.fecha.slice(0, 4));
}

export function annualCommitment(padrino: Pick<Padrino, "aportacion" | "periodicidad">): number {
  const factors = { unica: 1, mensual: 12, trimestral: 4, semestral: 2, anual: 1 };
  return padrino.aportacion * factors[padrino.periodicidad];
}

export function donationsForYear(donations: Donation[], year: number): Donation[] {
  return donations.filter((item) => item.estatus === "registrado" && donationYear(item) === year);
}

export function accumulatedDonations(donations: Donation[], year: number, padrinoId?: string): number {
  return donationsForYear(donations, year)
    .filter((item) => !padrinoId || item.padrino_id === padrinoId)
    .reduce((sum, item) => sum + item.monto, 0);
}

export function monthlyDonations(donations: Donation[], year: number, padrinoId?: string): number[] {
  const result = Array.from({ length: 12 }, () => 0);
  donationsForYear(donations, year)
    .filter((item) => !padrinoId || item.padrino_id === padrinoId)
    .forEach((item) => { result[Number(item.fecha.slice(5, 7)) - 1] += item.monto; });
  return result;
}
