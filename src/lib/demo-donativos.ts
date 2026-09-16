import type { Donation } from "@/lib/donativos";

function donation(id: string, padrino_id: string, fecha: string, monto: number, metodo_pago: Donation["metodo_pago"], referencia: string): Donation {
  return { id, padrino_id, fecha, monto, metodo_pago, referencia, comentarios: "", quincena: Number(fecha.slice(8, 10)) <= 15 ? "primera" : "segunda", estatus: "registrado", created_at: `${fecha}T12:00:00Z` };
}

export const DEMO_DONATIONS: Donation[] = [
  donation("don-1", "demo-1", "2026-01-08", 800, "transferencia", "TR-1001"),
  donation("don-2", "demo-1", "2026-02-09", 800, "transferencia", "TR-1128"),
  donation("don-3", "demo-1", "2026-03-07", 800, "transferencia", "TR-1270"),
  donation("don-4", "demo-1", "2026-04-10", 800, "transferencia", "TR-1402"),
  donation("don-5", "demo-2", "2026-02-18", 12000, "deposito", "DEP-2208"),
  donation("don-6", "demo-2", "2026-05-20", 12000, "deposito", "DEP-2511"),
  donation("don-7", "demo-3", "2026-03-14", 1000, "tarjeta", "TC-0314"),
  donation("don-8", "demo-5", "2026-06-04", 25000, "transferencia", "TR-2604"),
  donation("don-9", "demo-6", "2026-07-19", 1500, "efectivo", "REC-0719"),
  donation("don-10", "demo-1", "2025-11-10", 800, "transferencia", "TR-251110"),
  donation("don-11", "demo-2", "2025-12-18", 12000, "deposito", "DEP-251218"),
];
