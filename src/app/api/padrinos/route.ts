import { NextResponse } from "next/server";
import { fromDatabasePadrino, normalizePadrino, padrinoSchema, toDatabasePadrino, type Padrino } from "@/lib/padrinos";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });
    const { data, error } = await supabase.from("padrinos").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json((data as (Padrino & { proximo_seguimiento: string | null })[]).map(fromDatabasePadrino));
  } catch (reason) {
    return NextResponse.json({ error: reason instanceof Error ? reason.message : "Error al consultar" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const parsed = padrinoSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues.map((item) => item.message).join("; ") }, { status: 400 });
    }
    const input = normalizePadrino(parsed.data);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });

    const { data: emailDuplicate, error: emailError } = await supabase.from("padrinos").select("id").eq("email", input.email).limit(1);
    if (emailError) throw emailError;
    let rfcDuplicate: { id: string }[] | null = null;
    if (input.rfc) {
      const result = await supabase.from("padrinos").select("id").eq("rfc", input.rfc).limit(1);
      if (result.error) throw result.error;
      rfcDuplicate = result.data;
    }
    if (emailDuplicate?.length || rfcDuplicate?.length) return NextResponse.json({ error: "Ya existe un padrino con el mismo RFC o correo electrónico" }, { status: 409 });

    const { data, error } = await supabase.from("padrinos").insert(toDatabasePadrino(input)).select().single();
    if (error) throw error;
    return NextResponse.json(fromDatabasePadrino(data as Padrino & { proximo_seguimiento: string | null }), { status: 201 });
  } catch (reason) {
    return NextResponse.json({ error: reason instanceof Error ? reason.message : "Error al crear" }, { status: 500 });
  }
}
