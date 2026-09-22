"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ChevronLeft, CircleDollarSign, Gift, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { CartasPanel } from "@/components/cartas-panel";
import { PadrinoForm } from "@/components/padrino-form";
import { usePadrinos } from "@/components/padrinos-provider";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState, LoadingState, PageHeader } from "@/components/ui";
import { optionLabel } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { padrinoName } from "@/lib/padrinos";

export default function EditPadrinoPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { padrinos, loading } = usePadrinos();
  if (loading) return <LoadingState />;
  const padrino = padrinos.find((item) => item.id === id);
  if (!padrino) return <EmptyState title="Padrino no encontrado" description="El registro no existe o ya no está disponible." action={<Link className="button button-primary" href="/padrinos">Volver al padrón</Link>} />;
  const requestedTab = searchParams.get("tab");
  const activeTab = requestedTab === "datos" || requestedTab === "posada" ? requestedTab : "resumen";
  return <><PageHeader eyebrow="Padrón" title={padrinoName(padrino)} description="Consulta su información y gestiona sus participaciones desde una sola ficha." actions={<Link className="button button-secondary" href="/padrinos"><ChevronLeft />Volver</Link>} />
    {searchParams.get("guardado") && <div className="alert alert-success">Los cambios se guardaron correctamente.</div>}
    <nav className="profile-tabs" aria-label="Secciones del padrino">
      <Link className={activeTab === "resumen" ? "active" : ""} href={`/padrinos/${id}`}>Resumen</Link>
      <Link className={activeTab === "datos" ? "active" : ""} href={`/padrinos/${id}?tab=datos`}>Datos del padrino</Link>
      <Link className={activeTab === "posada" ? "active" : ""} href={`/padrinos/${id}?tab=posada`}>Ahijados de posada</Link>
    </nav>
    {activeTab === "resumen" && <div className="profile-summary">
      <section className="card profile-overview"><div className="profile-avatar"><UserRound /></div><div><span className="eyebrow">Estado del padrino</span><h2>{padrinoName(padrino)}</h2><StatusBadge status={padrino.estatus} /></div><div className="profile-kind">{padrino.tipo_aportacion === "especie_navidad" ? <><Gift /><span><strong>Padrino de posada</strong><small>Regalos navideños en especie</small></span></> : <><CircleDollarSign /><span><strong>{formatCurrency(padrino.aportacion)}</strong><small>{optionLabel("periodicidad", padrino.periodicidad)}</small></span></>}</div></section>
      <section className="card profile-contact"><div className="card-header"><h2>Contacto</h2></div><div className="card-body profile-contact-grid"><div><Mail /><span><small>Correo</small><strong>{padrino.email || "No registrado"}</strong></span></div><div><Phone /><span><small>Teléfono</small><strong>{padrino.telefono || "No registrado"}</strong></span></div><div><MapPin /><span><small>Ubicación</small><strong>{[padrino.municipio, padrino.estado].filter(Boolean).join(", ") || "No registrada"}</strong></span></div></div></section>
      <section className="card profile-next"><div><Gift /><span><h2>Campaña de Posada</h2><p>Asigna o consulta los ahijados vinculados con este padrino.</p></span></div><Link className="button button-primary" href={`/padrinos/${id}?tab=posada`}>Ver ahijados</Link></section>
    </div>}
    {activeTab === "datos" && <PadrinoForm padrino={padrino} />}
    {activeTab === "posada" && <CartasPanel padrinoId={padrino.id} />}
  </>;
}
