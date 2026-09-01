"use client";

import Link from "next/link";
import { ArrowRight, CalendarClock, CircleDollarSign, Plus, Upload, Users } from "lucide-react";
import { BarChart, DonutChart } from "@/components/charts";
import { usePadrinos } from "@/components/padrinos-provider";
import { StatusBadge } from "@/components/status-badge";
import { LoadingState, PageHeader } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/format";
import { monthlyEquivalent, padrinoName } from "@/lib/padrinos";

export default function DashboardPage() {
  const { padrinos, loading, error, demoMode } = usePadrinos();
  if (loading) return <LoadingState />;

  const counts = {
    activo: padrinos.filter((item) => item.estatus === "activo").length,
    pendiente: padrinos.filter((item) => item.estatus === "pendiente").length,
    inactivo: padrinos.filter((item) => item.estatus === "inactivo").length,
  };
  const monthly = padrinos.filter((item) => item.estatus === "activo").reduce((sum, item) => sum + monthlyEquivalent(item), 0);
  const unique = padrinos.filter((item) => item.periodicidad === "unica" && item.estatus === "activo").reduce((sum, item) => sum + item.aportacion, 0);
  const upcoming = padrinos.filter((item) => item.proximo_seguimiento).sort((a, b) => a.proximo_seguimiento.localeCompare(b.proximo_seguimiento)).slice(0, 5);
  const origins = Object.entries(padrinos.reduce<Record<string, number>>((acc, item) => { acc[item.origen] = (acc[item.origen] ?? 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const originLabels: Record<string, string> = { recomendacion: "Recomendación", redes: "Redes sociales", evento: "Evento", empresa: "Empresa", sitio_web: "Sitio web", otro: "Otro" };

  return (
    <>
      <PageHeader eyebrow="Vista general" title="Resumen del padrón" description="Indicadores actuales de padrinos y compromisos de aportación." actions={<><Link href="/importar" className="button button-secondary"><Upload />Importar</Link><Link href="/padrinos/nuevo" className="button button-primary"><Plus />Nuevo padrino</Link></>} />
      {demoMode && <div className="alert alert-info">Estás viendo información demostrativa. Puedes modificarla sin afectar datos reales.</div>}
      {error && <div className="alert" role="alert">{error}</div>}
      <section className="metric-grid" aria-label="Indicadores principales">
        <div className="card metric"><span className="metric-label"><Users size={15} /> Padrinos registrados</span><strong className="metric-value">{padrinos.length}</strong><span className="metric-help">{counts.activo} activos</span></div>
        <div className="card metric"><span className="metric-label"><CircleDollarSign size={15} /> Compromiso mensual</span><strong className="metric-value">{formatCurrency(monthly)}</strong><span className="metric-help">Equivalente recurrente</span></div>
        <div className="card metric"><span className="metric-label"><CircleDollarSign size={15} /> Aportaciones únicas</span><strong className="metric-value">{formatCurrency(unique)}</strong><span className="metric-help">Padrinos activos</span></div>
        <div className="card metric"><span className="metric-label"><CalendarClock size={15} /> Seguimientos</span><strong className="metric-value">{upcoming.length}</strong><span className="metric-help">Próximos registrados</span></div>
      </section>
      <section className="content-grid">
        <article className="card"><div className="card-header"><h2>Estado del padrón</h2><Link className="table-link" href="/reportes">Ver reporte <ArrowRight size={14} /></Link></div><div className="card-body"><DonutChart centerLabel="padrinos" slices={[{ label: "Activos", value: counts.activo, color: "#239666" }, { label: "Pendientes", value: counts.pendiente, color: "#e3a319" }, { label: "Inactivos", value: counts.inactivo, color: "#d6554d" }]} /></div></article>
        <article className="card"><div className="card-header"><h2>Origen de captación</h2></div><div className="card-body"><BarChart items={origins.map(([label, value], index) => ({ label: originLabels[label] ?? label, value, color: ["#2f68b2", "#477fc5", "#73a2d9", "#93b7e1", "#bed2ea"][index] }))} /></div></article>
      </section>
      <section className="card dashboard-followups"><div className="card-header"><h2>Próximos seguimientos</h2><Link className="table-link" href="/padrinos">Abrir padrón <ArrowRight size={14} /></Link></div><div className="table-wrap"><table><thead><tr><th>Padrino</th><th>Fecha</th><th>Canal</th><th>Estado</th></tr></thead><tbody>{upcoming.length ? upcoming.map((item) => <tr key={item.id}><td><Link className="table-link" href={`/padrinos/${item.id}`}>{padrinoName(item)}</Link></td><td>{formatDate(item.proximo_seguimiento)}</td><td>{item.canal_preferido === "correo" ? "Correo electrónico" : item.canal_preferido[0].toUpperCase() + item.canal_preferido.slice(1)}</td><td><StatusBadge status={item.estatus} /></td></tr>) : <tr><td colSpan={4}>No hay seguimientos programados.</td></tr>}</tbody></table></div></section>
    </>
  );
}
