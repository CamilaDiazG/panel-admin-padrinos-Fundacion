import { NextResponse } from "next/server";
import { fromDatabasePadrino, isDuplicate, normalizePadrino, padrinoSchema, toDatabasePadrino, type ImportIssue, type Padrino } from "@/lib/padrinos";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { rows?: unknown[] };
    if (!Array.isArray(body.rows)) return NextResponse.json({ error: "El archivo no contiene filas" }, { status: 400 });
    if (body.rows.length > 5000) return NextResponse.json({ error: "El máximo permitido es de 5,000 filas" }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });
    const { data: existing, error: queryError } = await supabase.from("padrinos").select("*");
    if (queryError) throw queryError;

    const working = (existing ?? []).map((item) => fromDatabasePadrino(item as Padrino & { proximo_seguimiento: string | null }));
    const valid: ReturnType<typeof normalizePadrino>[] = [];
    const issues: ImportIssue[] = [];
    body.rows.forEach((row, index) => {
      const parsed = padrinoSchema.safeParse(row);
      if (!parsed.success) {
        issues.push({ fila: index + 2, motivo: parsed.error.issues.map((item) => item.message).join("; ") });
        return;
      }
      const input = normalizePadrino(parsed.data);
      if (isDuplicate(input, working)) {
        issues.push({ fila: index + 2, motivo: "RFC o correo duplicado", email: input.email, rfc: input.rfc });
        return;
      }
      valid.push(input);
      working.push({ ...input, id: `pending-${index}`, created_at: "", updated_at: "" });
    });

    let inserted: Padrino[] = [];
    if (valid.length) {
      const { data, error } = await supabase.from("padrinos").insert(valid.map(toDatabasePadrino)).select();
      if (error) throw error;
      inserted = (data as (Padrino & { proximo_seguimiento: string | null })[]).map(fromDatabasePadrino);
    }
    await supabase.from("importaciones").insert({
      archivo: "carga-web",
      filas_totales: body.rows.length,
      filas_insertadas: inserted.length,
      filas_rechazadas: issues.length,
      incidencias: issues,
    });
    return NextResponse.json({ inserted, issues });
  } catch (reason) {
    return NextResponse.json({ error: reason instanceof Error ? reason.message : "Error al importar" }, { status: 500 });
  }
}
