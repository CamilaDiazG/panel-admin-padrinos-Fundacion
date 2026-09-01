import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PadrinoForm } from "@/components/padrino-form";
import { PageHeader } from "@/components/ui";

export default function NewPadrinoPage() {
  return <><PageHeader eyebrow="Padrón" title="Nuevo padrino" description="Captura la información de contacto y el compromiso de aportación." actions={<Link className="button button-secondary" href="/padrinos"><ChevronLeft />Volver</Link>} /><PadrinoForm /></>;
}
