import { z } from "zod";

export const CARTA_FILE_MAX_BYTES = 10 * 1024 * 1024;
export const CARTA_FILE_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp";

export const cartaSchema = z.object({
  padrino_id: z.string().min(1, "El padrino es obligatorio"),
  anio: z.coerce.number().int().min(2020).max(2100),
  paciente_nombre: z.string().trim().min(1, "El nombre del paciente es obligatorio").max(160),
  deseo_1: z.string().trim().min(1, "Escribe el primer regalo").max(250),
  deseo_2: z.string().trim().min(1, "Escribe el segundo regalo").max(250),
  deseo_3: z.string().trim().min(1, "Escribe el tercer regalo").max(250),
  medio_envio: z.enum(["whatsapp", "correo", "impresa", "otro"]),
  estado: z.enum(["pendiente", "enviada", "confirmada", "regalo_recibido"]),
  fecha_envio: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona una fecha")]).default(""),
  observaciones: z.string().trim().max(1000).default(""),
}).superRefine((data, ctx) => {
  if (data.estado !== "pendiente" && !data.fecha_envio) {
    ctx.addIssue({ code: "custom", path: ["fecha_envio"], message: "Indica cuándo se envió la carta" });
  }
});

export type CartaInput = z.infer<typeof cartaSchema>;

export interface CartaNavidad extends CartaInput {
  id: string;
  archivo_nombre: string;
  archivo_tipo: string;
  archivo_tamano: number;
  archivo: Blob;
  created_at: string;
  updated_at: string;
}

export const cartaDefaults: CartaInput = {
  padrino_id: "",
  anio: new Date().getFullYear(),
  paciente_nombre: "",
  deseo_1: "",
  deseo_2: "",
  deseo_3: "",
  medio_envio: "whatsapp",
  estado: "pendiente",
  fecha_envio: "",
  observaciones: "",
};

export const CARTA_ESTADOS = [
  { value: "pendiente", label: "Pendiente de envío" },
  { value: "enviada", label: "Enviada" },
  { value: "confirmada", label: "Recepción confirmada" },
  { value: "regalo_recibido", label: "Regalo recibido" },
] as const;

export const CARTA_MEDIOS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "correo", label: "Correo electrónico" },
  { value: "impresa", label: "Carta impresa" },
  { value: "otro", label: "Otro" },
] as const;

export function cartaEstadoLabel(value: CartaInput["estado"]): string {
  return CARTA_ESTADOS.find((item) => item.value === value)?.label ?? value;
}

export function cartaMedioLabel(value: CartaInput["medio_envio"]): string {
  return CARTA_MEDIOS.find((item) => item.value === value)?.label ?? value;
}

export function validateCartaFile(file: Pick<File, "name" | "size" | "type">): string | null {
  const extension = file.name.toLowerCase().split(".").pop();
  const allowedExtension = extension && ["pdf", "jpg", "jpeg", "png", "webp"].includes(extension);
  const allowedType = ["application/pdf", "image/jpeg", "image/png", "image/webp", ""].includes(file.type);
  if (!allowedExtension || !allowedType) return "El archivo debe ser PDF, JPG, PNG o WEBP";
  if (file.size > CARTA_FILE_MAX_BYTES) return "El archivo no puede superar 10 MB";
  if (file.size === 0) return "El archivo está vacío";
  return null;
}
