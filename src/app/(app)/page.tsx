"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, Download, Gift, HandCoins, Plus, Users } from "lucide-react";
import { DonutChart } from "@/components/charts";
import { useCartas } from "@/components/cartas-provider";
import { useDonations } from "@/components/donativos-provider";
import { usePadrinos } from "@/components/padrinos-provider";
import { LoadingState, PageHeader } from "@/components/ui";
import { donationsForYear } from "@/lib/donativos";
import { formatCurrency, formatDate } from "@/lib/format";
import { padrinoName } from "@/lib/padrinos";

export default function DashboardPage() {
  const { padrinos, loading, error } = usePadrinos();
  const { donations } = useDonations();
  const { cartas, loading: cartasLoading } = useCartas();
  if (loading || cartasLoading) return <LoadingState />;

  const year = new Date().getFullYear();
  const counts = {
    activo: padrinos.filter((item) => item.estatus === "activo").length,
    pendiente: padrinos.filter((item) => item.estatus === "pendiente").length,
    inactivo: padrinos.filter((item) => item.estatus === "inactivo").length,
  };
  const receivedDonations = donationsForYear(donations, year);
  const collected = receivedDonations.reduce((sum, item) => sum + item.monto, 0);
  const yearLetters = cartas.filter((item) => item.anio === year);
  const receivedGifts = yearLetters.filter((item) => item.regalos_recibidos).length;
  const campaignProgress = yearLetters.length ? Math.round(receivedGifts / yearLetters.length * 100) : 0;
  const pendingLetters = yearLetters.filter((item) => !item.confirmo_regalo);
  const upcoming = padrinos.filter((item) => item.proximo_seguimiento).sort((a, b) => a.proximo_seguimiento.localeCompare(b.proximo_seguimiento)).slice(0, 4);
  const attentionCount = pendingLetters.length + upcoming.length;
  const padrinoMap = new Map(padrinos.map((item) => [item.id, item]));
  const recentDonations = [...receivedDonations].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 5);

  return <>
    <PageHeader eyebrow="Panel administrativo" title="Resumen General" description="Bienvenido al panel administrativo. Consulta el estado actual de padrinos, campañas y donativos." actions={<><Link href="/reportes" className="button button-secondary"><Download />Exportar reporte</Link><Link href="/donativos" className="button button-primary"><Plus />Registrar donativo</Link></>} />
    {error && <div className="alert" role="alert">{error}</div>}

    <section className="metric-grid" aria-label="Indicadores principales">
      <div className="card metric"><span className="metric-label"><HandCoins /> Total recaudado</span><strong className="metric-value">{formatCurrency(collected)}</strong><span className="metric-help">Movimientos registrados en {year}</span></div>
      <div className="card metric"><span className="metric-label"><Users /> Padrinos activos</span><strong className="metric-value">{counts.activo}</strong><span className="metric-help">De {padrinos.length} padrinos registrados</span></div>
      <div className="card metric"><span className="metric-label"><Gift /> Avance de campaña</span><strong className="metric-value">{campaignProgress}%</strong><span className="metric-help">{receivedGifts} de {yearLetters.length} regalos recibidos</span></div>
      <div className="card metric"><span className="metric-label"><AlertTriangle /> Casos por atender</span><strong className="metric-value">{attentionCount}</strong><span className="metric-help">Confirmaciones y seguimientos</span></div>
    </section>

    <section className="dashboard-main-grid">
      <div className="dashboard-stack">
        <article className="card campaign-overview">
          <div className="card-header"><div><h2>Campaña de Posada {year}</h2><p>Meta anual y seguimiento de regalos.</p></div><span className="status-badge status-pending">◆ {pendingLetters.length} pendientes</span></div>
          <div className="card-body"><div className="campaign-progress-meta"><span>Regalos recibidos</span><strong>{campaignProgress}%</strong></div><div className="campaign-progress-track"><span style={{ width: `${campaignProgress}%` }} /></div><div className="campaign-progress-foot"><span>Ahijados asignados <strong>{yearLetters.length}</strong></span><span>Recibidos <strong>{receivedGifts}</strong></span></div><Link className="button button-primary button-small" href="/posada"><Gift />Abrir campaña</Link></div>
        </article>
        <article className="card sponsor-panorama"><div className="card-header"><h2>Panorama de padrinos</h2><Link className="table-link" href="/reportes">Ver reporte <ArrowRight /></Link></div><div className="card-body"><DonutChart centerLabel="padrinos" slices={[{ label: "Activos", value: counts.activo, color: "#2175bd" }, { label: "Pendientes", value: counts.pendiente, color: "#e87d0b" }, { label: "Inactivos", value: counts.inactivo, color: "#b42318" }]} /></div></article>
      </div>

      <article className="card attention-card"><div className="card-header"><div><h2>Alertas y avisos críticos</h2><p>Elementos que requieren atención administrativa.</p></div></div><div className="attention-list">
        {pendingLetters.slice(0, 3).map((item) => <Link href="/posada" className="attention-item attention-warning" key={item.id}><AlertTriangle /><span><strong>Confirmación pendiente</strong><small>{item.paciente_nombre} todavía no tiene confirmación del padrino.</small></span><ArrowRight /></Link>)}
        {upcoming.slice(0, 3).map((item) => <Link href={`/padrinos/${item.id}`} className="attention-item attention-info" key={item.id}><Clock3 /><span><strong>Seguimiento programado</strong><small>{padrinoName(item)} · {formatDate(item.proximo_seguimiento)}</small></span><ArrowRight /></Link>)}
        {!attentionCount && <div className="attention-empty"><CheckCircle2 /><strong>Todo está al día</strong><span>No hay avisos que requieran atención inmediata.</span></div>}
      </div><Link href="/padrinos" className="attention-footer">Ir al centro de operaciones <ArrowRight /></Link></article>
    </section>

    <section className="card dashboard-recent"><div className="card-header"><div><h2>Últimos donativos registrados</h2><p>Movimientos recientes del año en curso.</p></div><Link className="table-link" href="/donativos">Ver todos los donativos <ArrowRight /></Link></div><div className="table-wrap"><table><thead><tr><th>Padrino</th><th>Cantidad</th><th>Fecha</th><th>Estado</th></tr></thead><tbody>{recentDonations.length ? recentDonations.map((item) => <tr key={item.id}><td>{padrinoMap.get(item.padrino_id) ? padrinoName(padrinoMap.get(item.padrino_id)!) : "Padrino no disponible"}</td><td><strong>{formatCurrency(item.monto)}</strong></td><td>{formatDate(item.fecha)}</td><td><span className="status-badge status-active">● Completado</span></td></tr>) : <tr><td colSpan={4}>Aún no hay donativos registrados en {year}.</td></tr>}</tbody></table></div></section>
  </>;
}
