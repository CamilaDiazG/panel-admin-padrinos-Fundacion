"use client";

import Link from "next/link";
import { Banknote, ChevronLeft, Gift, RotateCcw } from "lucide-react";
import { useState } from "react";
import { PadrinoForm } from "@/components/padrino-form";
import { PageHeader } from "@/components/ui";
import type { PadrinoInput } from "@/lib/padrinos";

export default function NewPadrinoPage() {
  const [choice, setChoice] = useState<PadrinoInput["tipo_aportacion"] | null>(null);

  return <>
    <PageHeader
      eyebrow="Padrón"
      title="Nuevo padrino"
      description={choice ? "Captura únicamente la información necesaria para este tipo de padrino." : "Primero elige cómo participará. El formulario se adaptará automáticamente."}
      actions={<>{choice && <button className="button button-secondary" onClick={() => setChoice(null)}><RotateCcw />Cambiar tipo</button>}<Link className="button button-secondary" href="/padrinos"><ChevronLeft />Volver</Link></>}
    />
    {!choice ? <section className="sponsor-type-grid" aria-label="Tipo de padrino">
      <button className="sponsor-type-card" onClick={() => setChoice("monetaria")}>
        <span className="sponsor-type-icon"><Banknote /></span>
        <span><strong>Donativo monetario</strong><small>Aportaciones únicas o recurrentes con monto y método de pago.</small></span>
        <b>Continuar →</b>
      </button>
      <button className="sponsor-type-card sponsor-type-christmas" onClick={() => setChoice("especie_navidad")}>
        <span className="sponsor-type-icon"><Gift /></span>
        <span><strong>Padrino de posada</strong><small>Empleado o persona externa que regalará a un ahijado en Navidad.</small></span>
        <b>Continuar →</b>
      </button>
    </section> : <PadrinoForm initialContributionType={choice} />}
  </>;
}
