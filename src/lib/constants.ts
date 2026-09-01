export const ESTADOS_MEXICO = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche",
  "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila", "Colima",
  "Durango", "Estado de México", "Guanajuato", "Guerrero", "Hidalgo",
  "Jalisco", "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca",
  "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa",
  "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán",
  "Zacatecas",
] as const;

export const OPTIONS = {
  tipo: [
    { value: "persona", label: "Persona física" },
    { value: "empresa", label: "Empresa" },
  ],
  estatus: [
    { value: "activo", label: "Activo" },
    { value: "pendiente", label: "Pendiente" },
    { value: "inactivo", label: "Inactivo" },
  ],
  canal: [
    { value: "whatsapp", label: "WhatsApp" },
    { value: "llamada", label: "Llamada" },
    { value: "correo", label: "Correo electrónico" },
  ],
  periodicidad: [
    { value: "unica", label: "Única" },
    { value: "mensual", label: "Mensual" },
    { value: "trimestral", label: "Trimestral" },
    { value: "semestral", label: "Semestral" },
    { value: "anual", label: "Anual" },
  ],
  metodo: [
    { value: "transferencia", label: "Transferencia" },
    { value: "tarjeta", label: "Tarjeta" },
    { value: "efectivo", label: "Efectivo" },
    { value: "deposito", label: "Depósito" },
    { value: "otro", label: "Otro" },
  ],
  origen: [
    { value: "recomendacion", label: "Recomendación" },
    { value: "redes", label: "Redes sociales" },
    { value: "evento", label: "Evento" },
    { value: "empresa", label: "Empresa o convenio" },
    { value: "sitio_web", label: "Sitio web" },
    { value: "otro", label: "Otro" },
  ],
} as const;

export function optionLabel(
  group: keyof typeof OPTIONS,
  value: string,
): string {
  return OPTIONS[group].find((item) => item.value === value)?.label ?? value;
}

export const STATUS_META = {
  activo: { label: "Activo", className: "status-active", symbol: "●" },
  pendiente: { label: "Pendiente", className: "status-pending", symbol: "◆" },
  inactivo: { label: "Inactivo", className: "status-inactive", symbol: "■" },
} as const;
