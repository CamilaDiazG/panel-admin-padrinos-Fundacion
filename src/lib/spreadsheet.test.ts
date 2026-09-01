import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { parseSpreadsheet } from "@/lib/spreadsheet";

describe("importación de hojas de cálculo", () => {
  it("reconoce encabezados amigables y opciones en español", () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{
      Tipo: "Empresa", "Razón social": "Prueba S.A.", "Correo electrónico": "hola@prueba.mx",
      Teléfono: "3312345678", País: "México", Estado: "Jalisco", Municipio: "Zapopan",
      "Código postal": "45019", "Fecha de alta": "01/09/2026", Aportación: 1200,
      Periodicidad: "Mensual", "Método de pago": "Transferencia", Origen: "Evento", "Estado del padrino": "Activo",
    }]), "Padrinos");
    const data = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
    const { rows } = parseSpreadsheet(data);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ tipo: "empresa", razon_social: "Prueba S.A.", periodicidad: "mensual", fecha_alta: "2026-09-01", estatus: "activo" });
  });
});
