"use client";

import { Download, FileBarChart, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { BarChart, DonutChart } from "@/components/charts";
import { usePadrinos } from "@/components/padrinos-provider";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState, LoadingState, PageHeader } from "@/components/ui";
import { ESTADOS_MEXICO, OPTIONS, optionLabel } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import { monthlyEquivalent, padrinoName, type Padrino } from "@/lib/padrinos";
import { exportReport } from "@/lib/spreadsheet";

type ReportId = "padron" | "aportaciones" | "captacion";

const reportNames: Record<ReportId, { label: string; description: string }> = {
  padron: { label: "1. Padrón y estatus", description: "Distribución, contacto y ubicación" },
  aportaciones: { label: "2. Aportaciones", description: "Compromisos y periodicidad" },
  captacion: { label: "3. Altas y captación", description: "Origen y seguimiento" },
};

function groupCount(rows: Padrino[], key: keyof Padrino) {
  return Object.entries(rows.reduce<Record<string, number>>((acc, item) => { const value = String(item[key] || "Sin especificar"); acc[value] = (acc[value] ?? 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]);
}

export default function ReportsPage() {
  const { padrinos, loading } = usePadrinos();
  const [report, setReport] = useState<ReportId>("padron");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("todos");
  const [type, setType] = useState("todos");
  const [state, setState] = useState("todos");

  const rows = useMemo(() => padrinos.filter((item) => (!from || item.fecha_alta >= from) && (!to || item.fecha_alta <= to) && (status === "todos" || item.estatus === status) && (type === "todos" || item.tipo === type) && (state === "todos" || item.estado === state)), [padrinos, from, to, status, type, state]);
  if (loading) return <LoadingState label="Preparando reportes…" />;

  const statusCounts = { activo: rows.filter((item) => item.estatus === "activo").length, pendiente: rows.filter((item) => item.estatus === "pendiente").length, inactivo: rows.filter((item) => item.estatus === "inactivo").length };
  const recurring = rows.filter((item) => item.estatus === "activo").reduce((sum, item) => sum + monthlyEquivalent(item), 0);
  const unique = rows.filter((item) => item.estatus === "activo" && item.periodicidad === "unica").reduce((sum, item) => sum + item.aportacion, 0);
  const totalDeclared = rows.reduce((sum, item) => sum + item.aportacion, 0);
  const byState = groupCount(rows, "estado").slice(0, 8);
  const byOrigin = groupCount(rows, "origen");
  const byMethod = OPTIONS.metodo.map((option) => ({ label: option.label, value: rows.filter((item) => item.metodo_pago === option.value).reduce((sum, item) => sum + item.aportacion, 0) })).filter((item) => item.value);
  const byFrequency = OPTIONS.periodicidad.map((option) => ({ label: option.label, value: rows.filter((item) => item.periodicidad === option.value).reduce((sum, item) => sum + item.aportacion, 0) })).filter((item) => item.value);
  const byMonth = Object.entries(rows.reduce<Record<string, number>>((acc, item) => { const month = item.fecha_alta.slice(0, 7); acc[month] = (acc[month] ?? 0) + 1; return acc; }, {})).sort(([a], [b]) => a.localeCompare(b));
  const followups = rows.filter((item) => item.proximo_seguimiento).sort((a, b) => a.proximo_seguimiento.localeCompare(b.proximo_seguimiento));

  function reset() { setFrom(""); setTo(""); setStatus("todos"); setType("todos"); setState("todos"); }

  function download() {
    let summary: Record<string, unknown>[];
    if (report === "padron") summary = [{ Indicador: "Total de padrinos", Valor: rows.length }, { Indicador: "Activos", Valor: statusCounts.activo }, { Indicador: "Pendientes", Valor: statusCounts.pendiente }, { Indicador: "Inactivos", Valor: statusCounts.inactivo }, ...byState.map(([label, value]) => ({ Indicador: `Ubicación: ${label}`, Valor: value }))];
    else if (report === "aportaciones") summary = [{ Indicador: "Compromiso mensual equivalente", Valor: recurring }, { Indicador: "Aportaciones únicas", Valor: unique }, { Indicador: "Total declarado", Valor: totalDeclared }, ...byFrequency.map((item) => ({ Indicador: `Periodicidad: ${item.label}`, Valor: item.value })), ...byMethod.map((item) => ({ Indicador: `Método: ${item.label}`, Valor: item.value }))];
    else summary = [{ Indicador: "Altas en el periodo", Valor: rows.length }, { Indicador: "Seguimientos programados", Valor: followups.length }, ...byMonth.map(([label, value]) => ({ Indicador: `Mes: ${label}`, Valor: value })), ...byOrigin.map(([label, value]) => ({ Indicador: `Origen: ${optionLabel("origen", label)}`, Valor: value }))];
    exportReport(`reporte-${report}`, summary, rows);
  }

  return <><PageHeader eyebrow="Análisis" title="Reportes" description="Tres vistas operativas con filtros compartidos y exportación del resultado visible." actions={<button className="button button-primary" onClick={download} disabled={!rows.length}><Download />Exportar a Excel</button>} />
    <div className="report-tabs" role="tablist" aria-label="Tipos de reporte">{(Object.entries(reportNames) as [ReportId, typeof reportNames[ReportId]][]).map(([id, meta]) => <button key={id} role="tab" aria-selected={report === id} className={report === id ? "selected" : ""} onClick={() => setReport(id)}><FileBarChart /><span><strong>{meta.label}</strong><small>{meta.description}</small></span></button>)}</div>
    <section className="card report-filters" aria-label="Filtros de reportes">
      <div className="field"><label htmlFor="from">Alta desde</label><input id="from" type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} /></div>
      <div className="field"><label htmlFor="to">Alta hasta</label><input id="to" type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} /></div>
      <div className="field"><label htmlFor="report-status">Estado</label><select id="report-status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="todos">Todos</option>{OPTIONS.estatus.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
      <div className="field"><label htmlFor="report-type">Tipo</label><select id="report-type" value={type} onChange={(event) => setType(event.target.value)}><option value="todos">Todos</option>{OPTIONS.tipo.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
      <div className="field"><label htmlFor="report-state">Ubicación</label><select id="report-state" value={state} onChange={(event) => setState(event.target.value)}><option value="todos">Todos los estados</option>{ESTADOS_MEXICO.map((item) => <option key={item}>{item}</option>)}</select></div>
      <button className="button button-secondary" onClick={reset}><RotateCcw />Limpiar</button>
    </section>
    {!rows.length ? <div className="card"><EmptyState title="Sin resultados" description="No hay padrinos que coincidan con los filtros seleccionados." /></div> : <>
      {report === "padron" && <PadronReport rows={rows} counts={statusCounts} byState={byState} />}
      {report === "aportaciones" && <ContributionsReport rows={rows} recurring={recurring} unique={unique} total={totalDeclared} byFrequency={byFrequency} byMethod={byMethod} />}
      {report === "captacion" && <AcquisitionReport rows={rows} byMonth={byMonth} byOrigin={byOrigin} followups={followups} />}
    </>}
  </>;
}

function PadronReport({ rows, counts, byState }: { rows: Padrino[]; counts: Record<"activo" | "pendiente" | "inactivo", number>; byState: [string, number][] }) {
  return <div className="report-content"><section className="metric-grid report-metrics"><div className="card metric"><span className="metric-label">Padrinos filtrados</span><strong className="metric-value">{rows.length}</strong></div><div className="card metric"><span className="metric-label">Activos</span><strong className="metric-value">{counts.activo}</strong></div><div className="card metric"><span className="metric-label">Pendientes</span><strong className="metric-value">{counts.pendiente}</strong></div><div className="card metric"><span className="metric-label">Inactivos</span><strong className="metric-value">{counts.inactivo}</strong></div></section><section className="content-grid equal"><article className="card"><div className="card-header"><h2>Distribución por estado</h2></div><div className="card-body"><DonutChart centerLabel="registros" slices={[{ label: "Activos", value: counts.activo, color: "#239666" }, { label: "Pendientes", value: counts.pendiente, color: "#e3a319" }, { label: "Inactivos", value: counts.inactivo, color: "#d6554d" }]} /></div></article><article className="card"><div className="card-header"><h2>Principales ubicaciones</h2></div><div className="card-body"><BarChart items={byState.map(([label, value]) => ({ label, value }))} /></div></article></section><DetailTable rows={rows} /></div>;
}

function ContributionsReport({ rows, recurring, unique, total, byFrequency, byMethod }: { rows: Padrino[]; recurring: number; unique: number; total: number; byFrequency: { label: string; value: number }[]; byMethod: { label: string; value: number }[] }) {
  return <div className="report-content"><section className="metric-grid report-metrics three"><div className="card metric"><span className="metric-label">Compromiso mensual equivalente</span><strong className="metric-value">{formatCurrency(recurring)}</strong></div><div className="card metric"><span className="metric-label">Aportaciones únicas activas</span><strong className="metric-value">{formatCurrency(unique)}</strong></div><div className="card metric"><span className="metric-label">Total declarado en registros</span><strong className="metric-value">{formatCurrency(total)}</strong></div></section><section className="content-grid equal"><article className="card"><div className="card-header"><h2>Por periodicidad</h2></div><div className="card-body"><BarChart items={byFrequency} valueFormatter={formatCurrency} /></div></article><article className="card"><div className="card-header"><h2>Por método de pago</h2></div><div className="card-body"><BarChart items={byMethod} valueFormatter={formatCurrency} /></div></article></section><DetailTable rows={rows} /></div>;
}

function AcquisitionReport({ rows, byMonth, byOrigin, followups }: { rows: Padrino[]; byMonth: [string, number][]; byOrigin: [string, number][]; followups: Padrino[] }) {
  return <div className="report-content"><section className="metric-grid report-metrics three"><div className="card metric"><span className="metric-label">Altas filtradas</span><strong className="metric-value">{rows.length}</strong></div><div className="card metric"><span className="metric-label">Meses con actividad</span><strong className="metric-value">{byMonth.length}</strong></div><div className="card metric"><span className="metric-label">Seguimientos programados</span><strong className="metric-value">{followups.length}</strong></div></section><section className="content-grid equal"><article className="card"><div className="card-header"><h2>Altas por mes</h2></div><div className="card-body"><BarChart items={byMonth.map(([label, value]) => ({ label, value }))} /></div></article><article className="card"><div className="card-header"><h2>Origen del contacto</h2></div><div className="card-body"><BarChart items={byOrigin.map(([label, value]) => ({ label: optionLabel("origen", label), value }))} /></div></article></section><section className="card report-table"><div className="card-header"><h2>Próximos seguimientos</h2></div><div className="table-wrap"><table><thead><tr><th>Padrino</th><th>Fecha</th><th>Canal</th><th>Estado</th></tr></thead><tbody>{followups.slice(0, 50).map((item) => <tr key={item.id}><td>{padrinoName(item)}</td><td>{formatDate(item.proximo_seguimiento)}</td><td>{optionLabel("canal", item.canal_preferido)}</td><td><StatusBadge status={item.estatus} /></td></tr>)}</tbody></table></div></section></div>;
}

function DetailTable({ rows }: { rows: Padrino[] }) {
  return <section className="card report-table"><div className="card-header"><h2>Detalle del reporte</h2><span className="record-count">{rows.length} registros</span></div><div className="table-wrap"><table><thead><tr><th>Padrino</th><th>Contacto</th><th>Ubicación</th><th>Aportación</th><th>Alta</th><th>Estado</th></tr></thead><tbody>{rows.slice(0, 50).map((item) => <tr key={item.id}><td>{padrinoName(item)}</td><td>{item.email}<br /><small>{item.telefono}</small></td><td>{item.municipio}, {item.estado}</td><td>{formatCurrency(item.aportacion)}<br /><small>{optionLabel("periodicidad", item.periodicidad)}</small></td><td>{formatDate(item.fecha_alta)}</td><td><StatusBadge status={item.estatus} /></td></tr>)}</tbody></table></div>{rows.length > 50 && <p className="preview-note">Se muestran 50 registros. El archivo Excel incluirá los {rows.length} resultados.</p>}</section>;
}
