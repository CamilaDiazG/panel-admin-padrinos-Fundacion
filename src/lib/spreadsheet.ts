import * as XLSX from "xlsx";
import { OPTIONS, optionLabel } from "@/lib/constants";
import { csvSafe, formatDate } from "@/lib/format";
import { padrinoDefaults, padrinoName, type ImportIssue, type Padrino, type PadrinoInput } from "@/lib/padrinos";

export const IMPORT_COLUMNS: { key: keyof PadrinoInput; label: string }[] = [
  { key: "tipo", label: "Tipo" }, { key: "nombres", label: "Nombres" },
  { key: "apellido_paterno", label: "Apellido paterno" }, { key: "apellido_materno", label: "Apellido materno" },
  { key: "razon_social", label: "Razón social" }, { key: "rfc", label: "RFC" },
  { key: "contacto_responsable", label: "Contacto responsable" }, { key: "email", label: "Correo electrónico" },
  { key: "telefono", label: "Teléfono" }, { key: "telefono_alterno", label: "Teléfono alterno" },
  { key: "canal_preferido", label: "Canal preferido" }, { key: "pais", label: "País" },
  { key: "estado", label: "Estado" }, { key: "municipio", label: "Municipio" },
  { key: "codigo_postal", label: "Código postal" }, { key: "colonia", label: "Colonia" },
  { key: "calle", label: "Calle" }, { key: "numero_exterior", label: "Número exterior" },
  { key: "numero_interior", label: "Número interior" }, { key: "fecha_alta", label: "Fecha de alta" },
  { key: "aportacion", label: "Aportación" }, { key: "periodicidad", label: "Periodicidad" },
  { key: "metodo_pago", label: "Método de pago" }, { key: "origen", label: "Origen" },
  { key: "proximo_seguimiento", label: "Próximo seguimiento" }, { key: "observaciones", label: "Observaciones" },
  { key: "estatus", label: "Estado del padrino" },
];

function normalizeHeader(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

const headerMap = new Map<string, keyof PadrinoInput>();
IMPORT_COLUMNS.forEach(({ key, label }) => {
  headerMap.set(normalizeHeader(label), key);
  headerMap.set(normalizeHeader(key), key);
});
headerMap.set("email", "email");
headerMap.set("correo", "email");
headerMap.set("cp", "codigo_postal");
headerMap.set("status", "estatus");

function normalizedOption(group: keyof typeof OPTIONS, value: unknown): string {
  const text = String(value ?? "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const found = OPTIONS[group].find((item) => item.value === text || item.label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === text);
  return found?.value ?? text;
}

function excelDate(value: unknown): string {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    return date ? `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}` : "";
  }
  const text = String(value).trim();
  const iso = text.match(/^(\d{4})[-/]([01]?\d)[-/]([0-3]?\d)$/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  const local = text.match(/^([0-3]?\d)[-/]([01]?\d)[-/](\d{4})$/);
  if (local) return `${local[3]}-${local[2].padStart(2, "0")}-${local[1].padStart(2, "0")}`;
  return text;
}

export function parseSpreadsheet(buffer: ArrayBuffer): { rows: PadrinoInput[]; headers: string[] } {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error("El archivo no contiene una hoja de datos");
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: true });
  const headers = rawRows[0] ? Object.keys(rawRows[0]) : [];
  const rows = rawRows.map((raw) => {
    const mapped: Record<string, unknown> = { ...padrinoDefaults };
    Object.entries(raw).forEach(([header, value]) => {
      const key = headerMap.get(normalizeHeader(header));
      if (key) mapped[key] = value;
    });
    mapped.tipo = normalizedOption("tipo", mapped.tipo);
    mapped.estatus = normalizedOption("estatus", mapped.estatus);
    mapped.canal_preferido = normalizedOption("canal", mapped.canal_preferido);
    mapped.periodicidad = normalizedOption("periodicidad", mapped.periodicidad);
    mapped.metodo_pago = normalizedOption("metodo", mapped.metodo_pago);
    mapped.origen = normalizedOption("origen", mapped.origen);
    mapped.fecha_alta = excelDate(mapped.fecha_alta);
    mapped.proximo_seguimiento = excelDate(mapped.proximo_seguimiento);
    mapped.codigo_postal = String(mapped.codigo_postal ?? "").replace(/\.0$/, "").padStart(5, "0");
    mapped.aportacion = Number(mapped.aportacion || 0);
    Object.keys(mapped).forEach((key) => {
      if (typeof mapped[key] === "number" && key !== "aportacion") mapped[key] = String(mapped[key]);
    });
    return mapped as unknown as PadrinoInput;
  });
  return { rows, headers };
}

export function downloadTemplate() {
  const sample: Record<string, string | number> = {};
  IMPORT_COLUMNS.forEach(({ key, label }) => {
    const values: Partial<Record<keyof PadrinoInput, string | number>> = {
      tipo: "Persona física", nombres: "Ejemplo", apellido_paterno: "Demostración", email: "ejemplo@correo.com",
      telefono: "3312345678", canal_preferido: "WhatsApp", pais: "México", estado: "Jalisco", municipio: "Zapopan",
      codigo_postal: "45019", fecha_alta: "2026-09-01", aportacion: 500, periodicidad: "Mensual",
      metodo_pago: "Transferencia", origen: "Recomendación", estatus: "Activo",
    };
    sample[label] = values[key] ?? "";
  });
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet([sample]);
  sheet["!cols"] = IMPORT_COLUMNS.map(() => ({ wch: 20 }));
  XLSX.utils.book_append_sheet(workbook, sheet, "Padrinos");
  XLSX.writeFile(workbook, "plantilla-importacion-padrinos.xlsx");
}

export function downloadIssues(issues: ImportIssue[]) {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(issues.map((item) => ({ Fila: item.fila, Motivo: csvSafe(item.motivo), Correo: csvSafe(item.email), RFC: csvSafe(item.rfc) })));
  XLSX.utils.book_append_sheet(workbook, sheet, "Incidencias");
  XLSX.writeFile(workbook, "incidencias-importacion.xlsx");
}

function detailRows(rows: Padrino[]) {
  return rows.map((item) => ({
    Padrino: csvSafe(padrinoName(item)), Tipo: optionLabel("tipo", item.tipo), RFC: csvSafe(item.rfc),
    Correo: csvSafe(item.email), Teléfono: csvSafe(item.telefono), Estado: item.estado, Municipio: item.municipio,
    "Fecha de alta": formatDate(item.fecha_alta), Aportación: item.aportacion, Periodicidad: optionLabel("periodicidad", item.periodicidad),
    "Método de pago": optionLabel("metodo", item.metodo_pago), Origen: optionLabel("origen", item.origen),
    "Próximo seguimiento": formatDate(item.proximo_seguimiento), Estatus: optionLabel("estatus", item.estatus),
  }));
}

export function exportReport(filename: string, summary: Record<string, unknown>[], rows: Padrino[]) {
  const workbook = XLSX.utils.book_new();
  const summarySheet = XLSX.utils.json_to_sheet(summary.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, csvSafe(value)]))));
  const detailSheet = XLSX.utils.json_to_sheet(detailRows(rows));
  summarySheet["!cols"] = [{ wch: 28 }, { wch: 22 }, { wch: 22 }];
  detailSheet["!cols"] = Array.from({ length: 14 }, () => ({ wch: 20 }));
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumen");
  XLSX.utils.book_append_sheet(workbook, detailSheet, "Detalle");
  XLSX.writeFile(workbook, `${filename}-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
