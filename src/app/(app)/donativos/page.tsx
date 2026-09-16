"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Download, HandCoins, Plus, RotateCcw, Save, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { BarChart } from "@/components/charts";
import { useDonations } from "@/components/donativos-provider";
import { usePadrinos } from "@/components/padrinos-provider";
import { LoadingState, PageHeader } from "@/components/ui";
import { MONTHS, accumulatedDonations, annualCommitment, donationDefaults, donationSchema, donationsForYear, monthlyDonations, type DonationInput } from "@/lib/donativos";
import { OPTIONS, optionLabel } from "@/lib/constants";
import { csvSafe, formatCurrency, formatDate } from "@/lib/format";
import { padrinoName } from "@/lib/padrinos";

export default function DonationsPage() {
  const { padrinos, loading } = usePadrinos();
  const { donations, createDonation, cancelDonation, resetDonations } = useDonations();
  const currentYear = new Date().getFullYear();
  const availableYears = useMemo(() => [...new Set([currentYear, ...donations.map((item) => Number(item.fecha.slice(0, 4)))])].sort((a, b) => b - a), [currentYear, donations]);
  const [year, setYear] = useState(availableYears[0] ?? currentYear);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");
  const { register, handleSubmit, reset, formState: { errors } } = useForm<DonationInput>({ resolver: zodResolver(donationSchema), defaultValues: donationDefaults });

  if (loading) return <LoadingState label="Preparando el control de donativos…" />;

  const yearDonations = donationsForYear(donations, year);
  const accumulated = accumulatedDonations(donations, year);
  const paidSponsorIds = new Set(yearDonations.map((item) => item.padrino_id));
  const eligiblePadrinos = padrinos.filter((item) => (item.fecha_alta <= `${year}-12-31` && item.estatus !== "inactivo") || paidSponsorIds.has(item.id));
  const expected = eligiblePadrinos.filter((item) => item.estatus !== "inactivo").reduce((sum, item) => sum + annualCommitment(item), 0);
  const pending = Math.max(expected - accumulated, 0);
  const monthly = monthlyDonations(donations, year);
  const normalizedQuery = query.trim().toLocaleLowerCase("es");
  const visiblePadrinos = eligiblePadrinos.filter((item) => !normalizedQuery || [padrinoName(item), item.rfc, item.email].join(" ").toLocaleLowerCase("es").includes(normalizedQuery));
  const padrinoMap = new Map(padrinos.map((item) => [item.id, item]));
  const progress = expected ? (accumulated / expected) * 100 : 0;

  function submit(values: DonationInput) {
    createDonation(values);
    setYear(Number(values.fecha.slice(0, 4)));
    setNotice("El donativo se registró correctamente.");
    setShowForm(false);
    reset({ ...donationDefaults, fecha: new Date().toISOString().slice(0, 10) });
  }

  function cancel(id: string) {
    if (!window.confirm("¿Deseas cancelar este movimiento? Se conservará en el historial y dejará de sumar en los acumulados.")) return;
    cancelDonation(id);
    setNotice("El movimiento se marcó como cancelado.");
  }

  async function exportControl() {
    const XLSX = await import("xlsx");
    const detail = visiblePadrinos.map((padrino) => {
      const monthValues = monthlyDonations(donations, year, padrino.id);
      const row: Record<string, string | number> = {
        Padrino: csvSafe(padrinoName(padrino)),
        RFC: csvSafe(padrino.rfc),
        Periodicidad: optionLabel("periodicidad", padrino.periodicidad),
        "Compromiso anual": annualCommitment(padrino),
        "Compromiso mensual equivalente": annualCommitment(padrino) / 12,
      };
      MONTHS.forEach((month, index) => { row[month] = monthValues[index]; });
      row.Acumulado = monthValues.reduce((sum, value) => sum + value, 0);
      row["Avance %"] = annualCommitment(padrino) ? Number(((row.Acumulado as number / annualCommitment(padrino)) * 100).toFixed(2)) : 0;
      return row;
    });
    const summary = [
      { Indicador: "Año", Valor: year },
      { Indicador: "Acumulado recibido", Valor: accumulated },
      { Indicador: "Compromiso anual", Valor: expected },
      { Indicador: "Pendiente", Valor: pending },
      { Indicador: "Padrinos con donativos", Valor: paidSponsorIds.size },
      ...MONTHS.map((month, index) => ({ Indicador: month, Valor: monthly[index] })),
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summary), "Resumen");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(detail), "Control mensual");
    XLSX.writeFile(workbook, `control-donativos-${year}.xlsx`);
  }

  return <>
    <PageHeader eyebrow="Control financiero" title="Control de donativos" description="Consulta los movimientos recibidos y su acumulado mensual por padrino." actions={<><button className="button button-secondary" onClick={() => void exportControl()} disabled={!visiblePadrinos.length}><Download />Exportar {year}</button><button className="button button-primary" onClick={() => { setShowForm((value) => !value); setNotice(""); }}><Plus />Registrar donativo</button></>} />

    <div className="alert alert-info"><HandCoins size={19} /><span><strong>Prototipo local.</strong> Los movimientos se guardan únicamente en este navegador hasta definir la integración con Oracle APEX.</span></div>
    {notice && <div className="alert alert-success" role="status">{notice}</div>}

    {showForm && <form className="card donation-form" onSubmit={handleSubmit(submit)} noValidate>
      <div className="card-header"><div><h2>Registrar movimiento</h2><p>El mes se determina automáticamente a partir de la fecha.</p></div><button type="button" className="button button-secondary button-small" onClick={() => setShowForm(false)}>Cerrar</button></div>
      <div className="form-grid card-body">
        <div className="field field-span-2"><label className="required" htmlFor="donation-padrino">Padrino</label><select id="donation-padrino" {...register("padrino_id")}><option value="">Selecciona…</option>{padrinos.filter((item) => item.estatus !== "inactivo").map((item) => <option key={item.id} value={item.id}>{padrinoName(item)}</option>)}</select>{errors.padrino_id && <span className="field-error">{errors.padrino_id.message}</span>}</div>
        <div className="field"><label className="required" htmlFor="donation-date">Fecha del donativo</label><input id="donation-date" type="date" {...register("fecha")} />{errors.fecha && <span className="field-error">{errors.fecha.message}</span>}</div>
        <div className="field"><label className="required" htmlFor="donation-amount">Monto (MXN)</label><input id="donation-amount" type="number" min="0.01" step="0.01" {...register("monto", { valueAsNumber: true })} />{errors.monto && <span className="field-error">{errors.monto.message}</span>}</div>
        <div className="field"><label className="required" htmlFor="donation-method">Método de aportación</label><select id="donation-method" {...register("metodo_pago")}>{OPTIONS.metodo.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
        <div className="field"><label className="required" htmlFor="donation-fortnight">Quincena</label><select id="donation-fortnight" {...register("quincena")}><option value="no_aplica">No aplica</option><option value="primera">Primera quincena</option><option value="segunda">Segunda quincena</option></select></div>
        <div className="field"><label htmlFor="donation-reference">Folio o referencia</label><input id="donation-reference" {...register("referencia")} placeholder="Transferencia, recibo o factura" />{errors.referencia && <span className="field-error">{errors.referencia.message}</span>}</div>
        <div className="field field-span-3"><label htmlFor="donation-comments">Comentarios</label><textarea id="donation-comments" {...register("comentarios")} placeholder="Observaciones administrativas" />{errors.comentarios && <span className="field-error">{errors.comentarios.message}</span>}</div>
      </div>
      <div className="donation-form-actions"><button className="button button-primary" type="submit"><Save />Guardar donativo</button></div>
    </form>}

    <section className="donation-toolbar card">
      <div className="field"><label htmlFor="donation-year">Año del control</label><select id="donation-year" value={year} onChange={(event) => setYear(Number(event.target.value))}>{availableYears.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
      <div className="field donation-search"><label htmlFor="donation-search">Buscar padrino</label><input id="donation-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre, correo o RFC" /></div>
      <button className="button button-secondary" onClick={() => { resetDonations(); setYear(currentYear); setNotice("Se restauraron los movimientos ficticios."); }}><RotateCcw />Restaurar demo</button>
    </section>

    <section className="metric-grid donation-metrics" aria-label={`Resumen de donativos ${year}`}>
      <div className="card metric"><span className="metric-label">Acumulado recibido</span><strong className="metric-value">{formatCurrency(accumulated)}</strong><span className="metric-help">Durante {year}</span></div>
      <div className="card metric"><span className="metric-label">Compromiso anual</span><strong className="metric-value">{formatCurrency(expected)}</strong><span className="metric-help">Padrinos activos del control</span></div>
      <div className="card metric"><span className="metric-label">Pendiente estimado</span><strong className="metric-value">{formatCurrency(pending)}</strong><span className="metric-help">Diferencia contra compromiso</span></div>
      <div className="card metric"><span className="metric-label">Avance anual</span><strong className="metric-value">{progress.toFixed(1)}%</strong><span className="metric-help">{paidSponsorIds.size} padrinos con movimientos</span></div>
    </section>

    <section className="card donation-chart"><div className="card-header"><h2>Acumulado por mes</h2><span className="record-count">{year}</span></div><div className="card-body"><BarChart items={MONTHS.map((month, index) => ({ label: month, value: monthly[index], color: index === new Date().getMonth() && year === currentYear ? "var(--orange)" : "var(--blue-700)" }))} valueFormatter={formatCurrency} /></div></section>

    <section className="card donation-control"><div className="card-header"><div><h2>Control mensual por padrino</h2><p>Formato consolidado a partir de los movimientos registrados.</p></div><span className="record-count">{visiblePadrinos.length} padrinos</span></div><div className="table-wrap"><table className="donation-matrix"><thead><tr><th>Padrino</th><th>Periodo</th><th>Esperado anual</th>{MONTHS.map((month) => <th key={month}>{month}</th>)}<th>Acumulado</th><th>Avance</th></tr></thead><tbody>{visiblePadrinos.map((padrino) => { const values = monthlyDonations(donations, year, padrino.id); const total = values.reduce((sum, value) => sum + value, 0); const commitment = annualCommitment(padrino); const pct = commitment ? (total / commitment) * 100 : 0; const tone = pct >= 100 ? "status-active" : pct > 0 ? "status-pending" : "status-inactive"; return <tr key={padrino.id}><td><div className="table-name"><strong>{padrinoName(padrino)}</strong><span>{padrino.rfc || padrino.email}</span></div></td><td>{optionLabel("periodicidad", padrino.periodicidad)}</td><td>{formatCurrency(commitment)}</td>{values.map((value, index) => <td className={value ? "month-paid" : "month-empty"} key={index}>{value ? formatCurrency(value) : "—"}</td>)}<td><strong>{formatCurrency(total)}</strong></td><td><span className={`status-badge ${tone}`}>{pct >= 100 ? "●" : pct > 0 ? "◆" : "■"} {pct.toFixed(0)}%</span></td></tr>; })}</tbody><tfoot><tr><th colSpan={3}>Total mensual</th>{monthly.map((value, index) => <th key={index}>{formatCurrency(value)}</th>)}<th>{formatCurrency(accumulated)}</th><th>{progress.toFixed(1)}%</th></tr></tfoot></table></div>{!visiblePadrinos.length && <div className="state-panel"><h3>Sin padrinos para mostrar</h3><p>Ajusta la búsqueda o registra padrinos antes de capturar donativos.</p></div>}</section>

    <section className="card donation-history"><div className="card-header"><div><h2>Movimientos de {year}</h2><p>Los movimientos cancelados se conservan para mantener trazabilidad.</p></div><span className="record-count">{donations.filter((item) => Number(item.fecha.slice(0, 4)) === year).length} movimientos</span></div><div className="table-wrap"><table><thead><tr><th>Fecha</th><th>Padrino</th><th>Referencia</th><th>Método</th><th>Quincena</th><th>Monto</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{donations.filter((item) => Number(item.fecha.slice(0, 4)) === year).sort((a, b) => b.fecha.localeCompare(a.fecha)).map((item) => { const padrino = padrinoMap.get(item.padrino_id); return <tr key={item.id} className={item.estatus === "cancelado" ? "cancelled-row" : ""}><td>{formatDate(item.fecha)}</td><td>{padrino ? padrinoName(padrino) : "Padrino no disponible"}</td><td>{item.referencia || "—"}</td><td>{optionLabel("metodo", item.metodo_pago)}</td><td>{item.quincena === "primera" ? "1ª" : item.quincena === "segunda" ? "2ª" : "—"}</td><td><strong>{formatCurrency(item.monto)}</strong></td><td>{item.estatus === "registrado" ? <span className="status-badge status-active">● Registrado</span> : <span className="status-badge status-inactive">■ Cancelado</span>}</td><td>{item.estatus === "registrado" ? <button className="button button-danger button-small" onClick={() => cancel(item.id)}><XCircle />Cancelar</button> : "—"}</td></tr>; })}</tbody></table></div></section>
  </>;
}
