import type { Padrino } from "@/lib/padrinos";

const base = {
  pais: "México",
  telefono_alterno: "",
  colonia: "",
  calle: "",
  numero_exterior: "",
  numero_interior: "",
  observaciones: "",
  created_by: "demo@fundacion.org",
  updated_by: "demo@fundacion.org",
};

export const DEMO_PADRINOS: Padrino[] = [
  {
    ...base, id: "demo-1", tipo: "persona", nombres: "Mariana", apellido_paterno: "López", apellido_materno: "Ruiz", razon_social: "", rfc: "LORM880515AB1", contacto_responsable: "", email: "mariana@example.com", telefono: "3312345678", canal_preferido: "whatsapp", estado: "Jalisco", municipio: "Zapopan", codigo_postal: "45019", fecha_alta: "2026-01-12", aportacion: 800, periodicidad: "mensual", metodo_pago: "transferencia", origen: "recomendacion", proximo_seguimiento: "2026-09-12", estatus: "activo", created_at: "2026-01-12T10:00:00Z", updated_at: "2026-01-12T10:00:00Z",
  },
  {
    ...base, id: "demo-2", tipo: "empresa", nombres: "", apellido_paterno: "", apellido_materno: "", razon_social: "Impulso Tapatío, S.A. de C.V.", rfc: "ITA190101XY2", contacto_responsable: "Carlos Rivera", email: "donativos@impulso.example", telefono: "3334567890", canal_preferido: "correo", estado: "Jalisco", municipio: "Guadalajara", codigo_postal: "44100", fecha_alta: "2026-02-08", aportacion: 12000, periodicidad: "trimestral", metodo_pago: "deposito", origen: "empresa", proximo_seguimiento: "2026-10-01", estatus: "activo", created_at: "2026-02-08T10:00:00Z", updated_at: "2026-02-08T10:00:00Z",
  },
  {
    ...base, id: "demo-3", tipo: "persona", nombres: "Eduardo", apellido_paterno: "Santos", apellido_materno: "Mora", razon_social: "", rfc: "", contacto_responsable: "", email: "eduardo@example.com", telefono: "3311122233", canal_preferido: "llamada", estado: "Jalisco", municipio: "Tlaquepaque", codigo_postal: "45500", fecha_alta: "2026-03-17", aportacion: 1000, periodicidad: "mensual", metodo_pago: "tarjeta", origen: "evento", proximo_seguimiento: "2026-09-20", estatus: "pendiente", created_at: "2026-03-17T10:00:00Z", updated_at: "2026-03-17T10:00:00Z",
  },
  {
    ...base, id: "demo-4", tipo: "persona", nombres: "Gabriela", apellido_paterno: "Núñez", apellido_materno: "", razon_social: "", rfc: "", contacto_responsable: "", email: "gabriela@example.com", telefono: "3319988776", canal_preferido: "correo", estado: "Nayarit", municipio: "Tepic", codigo_postal: "63000", fecha_alta: "2026-04-23", aportacion: 6000, periodicidad: "anual", metodo_pago: "transferencia", origen: "redes", proximo_seguimiento: "", estatus: "inactivo", created_at: "2026-04-23T10:00:00Z", updated_at: "2026-06-01T10:00:00Z",
  },
  {
    ...base, id: "demo-5", tipo: "empresa", nombres: "", apellido_paterno: "", apellido_materno: "", razon_social: "Soluciones del Valle", rfc: "SVA210707JQ3", contacto_responsable: "Ana Torres", email: "ana@soluciones.example", telefono: "3323456789", canal_preferido: "whatsapp", estado: "Jalisco", municipio: "Tlajomulco", codigo_postal: "45640", fecha_alta: "2026-06-04", aportacion: 25000, periodicidad: "unica", metodo_pago: "transferencia", origen: "sitio_web", proximo_seguimiento: "2026-09-05", estatus: "activo", created_at: "2026-06-04T10:00:00Z", updated_at: "2026-06-04T10:00:00Z",
  },
  {
    ...base, id: "demo-6", tipo: "persona", nombres: "Sofía", apellido_paterno: "Ramírez", apellido_materno: "Gil", razon_social: "", rfc: "", contacto_responsable: "", email: "sofia@example.com", telefono: "3312340099", canal_preferido: "whatsapp", estado: "Jalisco", municipio: "Zapopan", codigo_postal: "45110", fecha_alta: "2026-07-19", aportacion: 1500, periodicidad: "semestral", metodo_pago: "efectivo", origen: "recomendacion", proximo_seguimiento: "2026-09-30", estatus: "pendiente", created_at: "2026-07-19T10:00:00Z", updated_at: "2026-07-19T10:00:00Z",
  },
];
