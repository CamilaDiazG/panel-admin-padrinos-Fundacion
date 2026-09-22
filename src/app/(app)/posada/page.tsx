"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ExternalLink, FileUp, Gift, LoaderCircle, Plus, Search, UserPlus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useCartas } from "@/components/cartas-provider";
import { usePadrinos } from "@/components/padrinos-provider";
import { LoadingState, PageHeader } from "@/components/ui";
import { CARTA_FILE_ACCEPT, cartaDefaults, cartaSchema, cartaStatus, validateCartaFile, type CartaInput, type CartaNavidad } from "@/lib/cartas";
import { padrinoDefaults, padrinoName } from "@/lib/padrinos";

type Panel = "sponsor" | "assign" | null;
type StatusFilter = "todos" | "pendiente" | "confirmado" | "recibido";

function openFile(carta: CartaNavidad) {
  if (!carta.archivo) return;
  const url = URL.createObjectURL(carta.archivo);
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export default function PosadaPage() {
  const { padrinos, loading: padrinosLoading, createPadrino } = usePadrinos();
  const { cartas, loading: cartasLoading, error, createCarta, updateSeguimiento } = useCartas();
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => [...new Set([currentYear, ...cartas.map((item) => item.anio)])].sort((a, b) => b - a), [cartas, currentYear]);
  const [year, setYear] = useState(currentYear);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [panel, setPanel] = useState<Panel>(null);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [quickName, setQuickName] = useState("");
  const [quickPhone, setQuickPhone] = useState("");
  const [quickEmail, setQuickEmail] = useState("");
  const [quickOrigin, setQuickOrigin] = useState<"empleado_fundacion" | "otro">("empleado_fundacion");
  const [savingSponsor, setSavingSponsor] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [savingAssignment, setSavingAssignment] = useState(false);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CartaInput>({
    resolver: zodResolver(cartaSchema),
    defaultValues: { ...cartaDefaults, anio: currentYear },
  });

  if (padrinosLoading || cartasLoading) return <LoadingState label="Preparando la campaña de posada…" />;

  const sponsorMap = new Map(padrinos.map((item) => [item.id, item]));
  const yearRows = cartas.filter((item) => item.anio === year);
  const metrics = {
    total: yearRows.length,
    confirmed: yearRows.filter((item) => item.confirmo_regalo).length,
    received: yearRows.filter((item) => item.regalos_recibidos).length,
    pending: yearRows.filter((item) => !item.confirmo_regalo).length,
  };
  const normalizedQuery = query.trim().toLocaleLowerCase("es");
  const visibleRows = yearRows.filter((item) => {
    const sponsor = sponsorMap.get(item.padrino_id);
    const matchesQuery = !normalizedQuery || [item.paciente_nombre, sponsor ? padrinoName(sponsor) : "", item.deseo_1, item.deseo_2, item.deseo_3].join(" ").toLocaleLowerCase("es").includes(normalizedQuery);
    const matchesStatus = statusFilter === "todos" || (statusFilter === "recibido" && item.regalos_recibidos) || (statusFilter === "confirmado" && item.confirmo_regalo && !item.regalos_recibidos) || (statusFilter === "pendiente" && !item.confirmo_regalo);
    return matchesQuery && matchesStatus;
  }).sort((a, b) => a.paciente_nombre.localeCompare(b.paciente_nombre, "es"));

  function showPanel(next: Exclude<Panel, null>) {
    setPanel((current) => current === next ? null : next);
    setNotice("");
    setActionError("");
  }

  async function saveQuickSponsor(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError("");
    if (!quickName.trim()) { setActionError("Escribe el nombre del padrino."); return; }
    if (!quickPhone.trim() && !quickEmail.trim()) { setActionError("Escribe al menos un teléfono o correo."); return; }
    setSavingSponsor(true);
    try {
      const created = await createPadrino({
        ...padrinoDefaults,
        tipo_aportacion: "especie_navidad",
        tipo: "persona",
        nombres: quickName,
        apellido_paterno: "",
        email: quickEmail,
        telefono: quickPhone,
        estado: "",
        municipio: "",
        codigo_postal: "",
        origen: quickOrigin,
        estatus: "activo",
      });
      setValue("padrino_id", created.id);
      setQuickName(""); setQuickPhone(""); setQuickEmail("");
      setNotice("Padrino registrado. Ahora asígnale su ahijado.");
      setPanel("assign");
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "No fue posible registrar al padrino");
    } finally {
      setSavingSponsor(false);
    }
  }

  async function saveAssignment(values: CartaInput) {
    setActionError("");
    setNotice("");
    if (selectedFile) {
      const validationError = validateCartaFile(selectedFile);
      if (validationError) { setFileError(validationError); return; }
    }
    setSavingAssignment(true);
    try {
      await createCarta(values, selectedFile);
      setYear(values.anio);
      setNotice("Ahijado asignado correctamente.");
      setSelectedFile(null);
      setFileError("");
      reset({ ...cartaDefaults, anio: values.anio });
      setPanel(null);
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "No fue posible asignar el ahijado");
    } finally {
      setSavingAssignment(false);
    }
  }

  async function changeCheck(carta: CartaNavidad, field: "confirmo_regalo" | "regalos_recibidos", checked: boolean) {
    setUpdatingId(carta.id);
    setActionError("");
    try {
      await updateSeguimiento(carta.id, {
        confirmo_regalo: field === "confirmo_regalo" ? checked : carta.confirmo_regalo,
        regalos_recibidos: field === "regalos_recibidos" ? checked : carta.regalos_recibidos,
      });
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "No fue posible actualizar el seguimiento");
    } finally {
      setUpdatingId("");
    }
  }

  return <>
    <PageHeader eyebrow="Campaña anual" title={`Posada ${year}`} description="Asigna ahijados y consulta el avance de confirmaciones y regalos en un solo lugar." actions={<><button className="button button-secondary" onClick={() => showPanel("sponsor")}><UserPlus />Nuevo padrino de posada</button><button className="button button-primary" onClick={() => showPanel("assign")}><Plus />Asignar ahijado</button></>} />
    {error && <div className="alert" role="alert">{error}</div>}
    {actionError && <div className="alert" role="alert">{actionError}</div>}
    {notice && <div className="alert alert-success" role="status"><CheckCircle2 />{notice}</div>}

    {panel === "sponsor" && <section className="card posada-action-card">
      <div className="card-header"><div><h2>Nuevo padrino de posada</h2><p>Alta rápida para empleados o participantes externos.</p></div><button className="button button-secondary button-small" onClick={() => setPanel(null)}><X />Cerrar</button></div>
      <form className="posada-quick-form" onSubmit={saveQuickSponsor}>
        <div className="field"><label className="required" htmlFor="quick-name">Nombre completo</label><input id="quick-name" value={quickName} onChange={(event) => setQuickName(event.target.value)} /></div>
        <div className="field"><label htmlFor="quick-phone">Teléfono</label><input id="quick-phone" type="tel" value={quickPhone} onChange={(event) => setQuickPhone(event.target.value)} /></div>
        <div className="field"><label htmlFor="quick-email">Correo</label><input id="quick-email" type="email" value={quickEmail} onChange={(event) => setQuickEmail(event.target.value)} /></div>
        <div className="field"><label className="required" htmlFor="quick-origin">Participante</label><select id="quick-origin" value={quickOrigin} onChange={(event) => setQuickOrigin(event.target.value as typeof quickOrigin)}><option value="empleado_fundacion">Empleado de la fundación</option><option value="otro">Persona externa</option></select></div>
        <button className="button button-primary" disabled={savingSponsor}>{savingSponsor ? <LoaderCircle className="spin" /> : <UserPlus />}{savingSponsor ? "Guardando…" : "Guardar y asignar ahijado"}</button>
      </form>
    </section>}

    {panel === "assign" && <section className="card posada-action-card">
      <div className="card-header"><div><h2>Asignar ahijado</h2><p>Relaciona un niño con un padrino y registra sus tres opciones de regalo.</p></div><button className="button button-secondary button-small" onClick={() => setPanel(null)}><X />Cerrar</button></div>
      <form className="posada-assignment-form" onSubmit={handleSubmit(saveAssignment)} noValidate>
        <div className="form-grid">
          <div className="field field-span-2"><label className="required" htmlFor="posada-sponsor">Padrino</label><select id="posada-sponsor" {...register("padrino_id")}><option value="">Selecciona un padrino…</option>{padrinos.filter((item) => item.estatus !== "inactivo").sort((a, b) => padrinoName(a).localeCompare(padrinoName(b), "es")).map((item) => <option key={item.id} value={item.id}>{padrinoName(item)}{item.origen === "empleado_fundacion" ? " · Empleado" : ""}</option>)}</select>{errors.padrino_id && <span className="field-error">{errors.padrino_id.message}</span>}</div>
          <div className="field"><label className="required" htmlFor="posada-year">Campaña</label><input id="posada-year" type="number" min="2020" max="2100" {...register("anio", { valueAsNumber: true })} /></div>
          <div className="field field-span-3"><label className="required" htmlFor="posada-child">Nombre del ahijado</label><input id="posada-child" {...register("paciente_nombre")} />{errors.paciente_nombre && <span className="field-error">{errors.paciente_nombre.message}</span>}</div>
          <div className="field"><label className="required" htmlFor="posada-wish-1">Regalo 1</label><input id="posada-wish-1" {...register("deseo_1")} />{errors.deseo_1 && <span className="field-error">{errors.deseo_1.message}</span>}</div>
          <div className="field"><label className="required" htmlFor="posada-wish-2">Regalo 2</label><input id="posada-wish-2" {...register("deseo_2")} />{errors.deseo_2 && <span className="field-error">{errors.deseo_2.message}</span>}</div>
          <div className="field"><label className="required" htmlFor="posada-wish-3">Regalo 3</label><input id="posada-wish-3" {...register("deseo_3")} />{errors.deseo_3 && <span className="field-error">{errors.deseo_3.message}</span>}</div>
          <label className="check-card"><input type="checkbox" {...register("confirmo_regalo")} /><span><strong>Confirmó que sí regalará</strong><small>Puede marcarse después desde la tabla.</small></span></label>
          <label className="check-card"><input type="checkbox" {...register("regalos_recibidos")} /><span><strong>Ya recibimos sus regalos</strong><small>Puede marcarse después desde la tabla.</small></span></label>
          <details className="optional-upload field-span-3"><summary><FileUp />Adjuntar carta escaneada (opcional)</summary><div className="field"><input aria-label="Carta escaneada" type="file" accept={CARTA_FILE_ACCEPT} onChange={(event) => { const file = event.target.files?.[0] ?? null; setSelectedFile(file); setFileError(file ? validateCartaFile(file) ?? "" : ""); }} /><span className="field-hint">PDF o imagen, máximo 10 MB.</span>{fileError && <span className="field-error">{fileError}</span>}</div></details>
        </div>
        <div className="letter-form-actions"><button className="button button-secondary" type="button" onClick={() => setPanel(null)}>Cancelar</button><button className="button button-primary" disabled={savingAssignment}>{savingAssignment ? <LoaderCircle className="spin" /> : <Gift />}{savingAssignment ? "Guardando…" : "Asignar ahijado"}</button></div>
      </form>
    </section>}

    <section className="metric-grid posada-metrics" aria-label="Avance de campaña">
      <div className="card metric"><span className="metric-label">Ahijados asignados</span><strong className="metric-value">{metrics.total}</strong><span className="metric-help">Campaña {year}</span></div>
      <div className="card metric"><span className="metric-label">Pendientes de confirmar</span><strong className="metric-value">{metrics.pending}</strong><span className="metric-help">Requieren seguimiento</span></div>
      <div className="card metric"><span className="metric-label">Padrinos confirmados</span><strong className="metric-value">{metrics.confirmed}</strong><span className="metric-help">Sí participarán</span></div>
      <div className="card metric"><span className="metric-label">Regalos recibidos</span><strong className="metric-value">{metrics.received}</strong><span className="metric-help">Ya están en fundación</span></div>
    </section>

    <section className="card toolbar posada-toolbar" aria-label="Filtros de la campaña">
      <div className="field"><label htmlFor="posada-filter-year">Año</label><select id="posada-filter-year" value={year} onChange={(event) => setYear(Number(event.target.value))}>{years.map((item) => <option key={item}>{item}</option>)}</select></div>
      <div className="field search-field"><label htmlFor="posada-search">Buscar</label><div className="input-icon"><Search /><input id="posada-search" className="control" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Padrino, ahijado o regalo" /></div></div>
      <div className="field"><label htmlFor="posada-status">Seguimiento</label><select id="posada-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}><option value="todos">Todos</option><option value="pendiente">Pendiente de confirmar</option><option value="confirmado">Confirmado</option><option value="recibido">Regalos recibidos</option></select></div>
    </section>

    <section className="card posada-table-card">
      <div className="card-header"><div><h2>Seguimiento de ahijados</h2><p>Actualiza las casillas directamente conforme avance la campaña.</p></div><span className="record-count">{visibleRows.length} registros</span></div>
      {visibleRows.length ? <div className="table-wrap"><table className="posada-table"><thead><tr><th>Padrino</th><th>Ahijado</th><th>Regalos solicitados</th><th>Confirmó</th><th>Regalos recibidos</th><th>Carta</th></tr></thead><tbody>{visibleRows.map((carta) => { const sponsor = sponsorMap.get(carta.padrino_id); const status = cartaStatus(carta); return <tr key={carta.id}><td><div className="table-name">{sponsor ? <Link className="table-link" href={`/padrinos/${sponsor.id}?tab=posada`}>{padrinoName(sponsor)}</Link> : <strong>Padrino no disponible</strong>}<span>{sponsor?.origen === "empleado_fundacion" ? "Empleado de la fundación" : sponsor?.telefono || sponsor?.email || "Sin contacto"}</span></div></td><td><div className="table-name"><strong>{carta.paciente_nombre}</strong><span className={`status-badge ${status.className}`}>{status.symbol} {status.label}</span></div></td><td><ol className="gift-list"><li>{carta.deseo_1}</li><li>{carta.deseo_2}</li><li>{carta.deseo_3}</li></ol></td><td className="check-cell"><input aria-label={`${carta.paciente_nombre}: confirmó que regalará`} type="checkbox" checked={carta.confirmo_regalo} disabled={updatingId === carta.id} onChange={(event) => void changeCheck(carta, "confirmo_regalo", event.target.checked)} /></td><td className="check-cell"><input aria-label={`${carta.paciente_nombre}: regalos recibidos`} type="checkbox" checked={carta.regalos_recibidos} disabled={updatingId === carta.id} onChange={(event) => void changeCheck(carta, "regalos_recibidos", event.target.checked)} /></td><td>{carta.archivo ? <button className="button button-secondary button-small" onClick={() => openFile(carta)}><ExternalLink />Ver</button> : <span className="record-count">Sin archivo</span>}</td></tr>; })}</tbody></table></div> : <div className="state-panel"><Gift /><h3>No hay ahijados para mostrar</h3><p>Asigna el primer ahijado o modifica los filtros de búsqueda.</p><button className="button button-primary" onClick={() => setPanel("assign")}><Plus />Asignar ahijado</button></div>}
    </section>
  </>;
}
