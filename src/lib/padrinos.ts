import { z } from "zod";

const optionalText = z.string().trim().max(500).default("");

export const padrinoSchema = z
  .object({
    tipo: z.enum(["persona", "empresa"]),
    nombres: optionalText,
    apellido_paterno: optionalText,
    apellido_materno: optionalText,
    razon_social: optionalText,
    rfc: z.string().trim().max(13).default(""),
    contacto_responsable: optionalText,
    email: z.string().trim().max(160).refine((value) => !value || z.string().email().safeParse(value).success, "Escribe un correo válido"),
    telefono: z.string().trim().max(20).default(""),
    telefono_alterno: z.string().trim().max(20).default(""),
    canal_preferido: z.enum(["whatsapp", "llamada", "correo"]),
    pais: z.string().trim().max(80).default("México"),
    estado: z.string().trim().max(80).default(""),
    municipio: z.string().trim().max(100).default(""),
    codigo_postal: z.union([z.literal(""), z.string().trim().regex(/^\d{5}$/, "El código postal debe tener 5 dígitos")]).default(""),
    colonia: optionalText,
    calle: optionalText,
    numero_exterior: z.string().trim().max(20).default(""),
    numero_interior: z.string().trim().max(20).default(""),
    fecha_alta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona una fecha"),
    tipo_aportacion: z.enum(["monetaria", "especie_navidad"]).default("monetaria"),
    aportacion: z.coerce.number().min(0, "La aportación no puede ser negativa").max(100000000),
    periodicidad: z.enum(["unica", "mensual", "trimestral", "semestral", "anual"]),
    metodo_pago: z.enum(["transferencia", "tarjeta", "efectivo", "deposito", "otro"]),
    origen: z.enum(["recomendacion", "redes", "evento", "empresa", "empleado_fundacion", "sitio_web", "otro"]),
    proximo_seguimiento: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).default(""),
    observaciones: z.string().trim().max(2000).default(""),
    estatus: z.enum(["activo", "pendiente", "inactivo"]),
  })
  .superRefine((data, ctx) => {
    if (data.tipo === "persona" && !data.nombres) {
      ctx.addIssue({ code: "custom", path: ["nombres"], message: "El nombre es obligatorio" });
    }
    if (data.tipo === "persona" && data.tipo_aportacion === "monetaria" && !data.apellido_paterno) {
      ctx.addIssue({ code: "custom", path: ["apellido_paterno"], message: "El apellido paterno es obligatorio" });
    }
    if (data.tipo === "empresa" && !data.razon_social) {
      ctx.addIssue({ code: "custom", path: ["razon_social"], message: "La razón social es obligatoria" });
    }
    if (!data.email && !data.telefono) {
      ctx.addIssue({ code: "custom", path: ["telefono"], message: "Escribe al menos un teléfono o correo" });
    }
    if (data.tipo_aportacion === "monetaria") {
      if (!data.email) ctx.addIssue({ code: "custom", path: ["email"], message: "El correo es obligatorio" });
      if (!data.telefono) ctx.addIssue({ code: "custom", path: ["telefono"], message: "El teléfono es obligatorio" });
      if (!data.pais) ctx.addIssue({ code: "custom", path: ["pais"], message: "El país es obligatorio" });
      if (!data.estado) ctx.addIssue({ code: "custom", path: ["estado"], message: "El estado es obligatorio" });
      if (!data.municipio) ctx.addIssue({ code: "custom", path: ["municipio"], message: "El municipio es obligatorio" });
      if (!data.codigo_postal) ctx.addIssue({ code: "custom", path: ["codigo_postal"], message: "El código postal es obligatorio" });
    }
  });

export type PadrinoInput = z.infer<typeof padrinoSchema>;

export interface Padrino extends PadrinoInput {
  id: string;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface ImportIssue {
  fila: number;
  motivo: string;
  email?: string;
  rfc?: string;
}

export interface ImportResult {
  inserted: Padrino[];
  issues: ImportIssue[];
}

export const padrinoDefaults: PadrinoInput = {
  tipo: "persona",
  nombres: "",
  apellido_paterno: "",
  apellido_materno: "",
  razon_social: "",
  rfc: "",
  contacto_responsable: "",
  email: "",
  telefono: "",
  telefono_alterno: "",
  canal_preferido: "whatsapp",
  pais: "México",
  estado: "Jalisco",
  municipio: "Zapopan",
  codigo_postal: "",
  colonia: "",
  calle: "",
  numero_exterior: "",
  numero_interior: "",
  fecha_alta: new Date().toISOString().slice(0, 10),
  tipo_aportacion: "monetaria",
  aportacion: 0,
  periodicidad: "mensual",
  metodo_pago: "transferencia",
  origen: "recomendacion",
  proximo_seguimiento: "",
  observaciones: "",
  estatus: "pendiente",
};

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeRfc(value: string): string {
  return value.replace(/\s/g, "").toUpperCase();
}

export function normalizePhone(value: string): string {
  return value.replace(/[^\d+]/g, "");
}

export function normalizePadrino(input: PadrinoInput): PadrinoInput {
  const normalized = {
    ...input,
    email: normalizeEmail(input.email),
    rfc: normalizeRfc(input.rfc),
    telefono: normalizePhone(input.telefono),
    telefono_alterno: normalizePhone(input.telefono_alterno),
    nombres: input.nombres.trim(),
    apellido_paterno: input.apellido_paterno.trim(),
    apellido_materno: input.apellido_materno.trim(),
    razon_social: input.razon_social.trim(),
  };
  return input.tipo_aportacion === "especie_navidad"
    ? { ...normalized, aportacion: 0, periodicidad: "unica", metodo_pago: "otro" }
    : normalized;
}

export function toDatabasePadrino(input: PadrinoInput): Omit<PadrinoInput, "proximo_seguimiento"> & { proximo_seguimiento: string | null } {
  return { ...input, proximo_seguimiento: input.proximo_seguimiento || null };
}

export function fromDatabasePadrino(input: Padrino & { proximo_seguimiento: string | null }): Padrino {
  return { ...input, proximo_seguimiento: input.proximo_seguimiento || "" };
}

export function padrinoName(padrino: Pick<PadrinoInput, "tipo" | "nombres" | "apellido_paterno" | "apellido_materno" | "razon_social">): string {
  if (padrino.tipo === "empresa") return padrino.razon_social;
  return [padrino.nombres, padrino.apellido_paterno, padrino.apellido_materno]
    .filter(Boolean)
    .join(" ");
}

export function monthlyEquivalent(padrino: Pick<PadrinoInput, "aportacion" | "periodicidad">): number {
  const factors = { unica: 0, mensual: 1, trimestral: 1 / 3, semestral: 1 / 6, anual: 1 / 12 };
  return padrino.aportacion * factors[padrino.periodicidad];
}

export function isDuplicate(candidate: PadrinoInput, existing: Padrino[], ignoreId?: string): Padrino | undefined {
  const email = normalizeEmail(candidate.email);
  const rfc = normalizeRfc(candidate.rfc);
  return existing.find((item) =>
    item.id !== ignoreId &&
    ((rfc && normalizeRfc(item.rfc) === rfc) || (email && normalizeEmail(item.email) === email)),
  );
}
