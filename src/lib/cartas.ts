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
  confirmo_regalo: z.boolean().default(false),
  regalos_recibidos: z.boolean().default(false),
  observaciones: z.string().trim().max(1000).default(""),
});

export type CartaInput = z.infer<typeof cartaSchema>;

export interface CartaNavidad extends CartaInput {
  id: string;
  archivo_nombre: string;
  archivo_tipo: string;
  archivo_tamano: number;
  archivo?: Blob;
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
  confirmo_regalo: false,
  regalos_recibidos: false,
  observaciones: "",
};

export function cartaStatus(carta: Pick<CartaInput, "confirmo_regalo" | "regalos_recibidos">) {
  if (carta.regalos_recibidos) return { label: "Regalos recibidos", className: "status-active", symbol: "●" };
  if (carta.confirmo_regalo) return { label: "Confirmó que regalará", className: "status-active", symbol: "●" };
  return { label: "Pendiente de confirmar", className: "status-pending", symbol: "◆" };
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
