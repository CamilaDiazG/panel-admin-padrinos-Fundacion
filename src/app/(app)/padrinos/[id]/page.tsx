"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PadrinoForm } from "@/components/padrino-form";
import { usePadrinos } from "@/components/padrinos-provider";
import { EmptyState, LoadingState, PageHeader } from "@/components/ui";
import { padrinoName } from "@/lib/padrinos";

export default function EditPadrinoPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { padrinos, loading } = usePadrinos();
  if (loading) return <LoadingState />;
  const padrino = padrinos.find((item) => item.id === id);
  if (!padrino) return <EmptyState title="Padrino no encontrado" description="El registro no existe o ya no está disponible." action={<Link className="button button-primary" href="/padrinos">Volver al padrón</Link>} />;
  return <><PageHeader eyebrow="Padrón" title={padrinoName(padrino)} description="Consulta o actualiza la información del padrino." actions={<Link className="button button-secondary" href="/padrinos"><ChevronLeft />Volver</Link>} />{searchParams.get("guardado") && <div className="alert alert-success">Los cambios se guardaron correctamente.</div>}<PadrinoForm padrino={padrino} /></>;
}
