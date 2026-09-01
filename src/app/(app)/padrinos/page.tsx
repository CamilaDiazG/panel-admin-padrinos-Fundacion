"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { usePadrinos } from "@/components/padrinos-provider";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState, LoadingState, PageHeader } from "@/components/ui";
import { OPTIONS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import { padrinoName, type Padrino } from "@/lib/padrinos";

const PAGE_SIZE = 10;

export default function PadrinosPage() {
  const { padrinos, loading, error, updatePadrino } = usePadrinos();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const [type, setType] = useState("todos");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return padrinos.filter((item) => (!query || [padrinoName(item), item.email, item.rfc, item.telefono, item.municipio].join(" ").toLowerCase().includes(query)) && (status === "todos" || item.estatus === status) && (type === "todos" || item.tipo === type)).sort((a, b) => {
      if (sort === "name") return padrinoName(a).localeCompare(padrinoName(b), "es");
      if (sort === "amount") return b.aportacion - a.aportacion;
      return b.fecha_alta.localeCompare(a.fecha_alta);
    });
  }, [padrinos, search, status, type, sort]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  async function toggle(item: Padrino) {
    setActionError("");
    const nextStatus = item.estatus === "inactivo" ? "activo" : "inactivo";
    if (!window.confirm(`¿Deseas cambiar el estado de ${padrinoName(item)} a ${nextStatus}?`)) return;
    try { await updatePadrino(item.id, { ...item, estatus: nextStatus }); }
    catch (reason) { setActionError(reason instanceof Error ? reason.message : "No fue posible cambiar el estado"); }
  }

  if (loading) return <LoadingState />;
  return <><PageHeader eyebrow="Administración" title="Padrón de padrinos" description={`${padrinos.length} registros disponibles para consulta y seguimiento.`} actions={<Link className="button button-primary" href="/padrinos/nuevo"><Plus />Nuevo padrino</Link>} />
    {(error || actionError) && <div className="alert" role="alert">{error || actionError}</div>}
    <section className="card toolbar" aria-label="Filtros del padrón">
      <div className="field search-field"><label htmlFor="search">Buscar</label><div className="input-icon"><Search aria-hidden="true" /><input id="search" className="control" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Nombre, correo, RFC o teléfono" /></div></div>
      <div className="field"><label htmlFor="status">Estado</label><select id="status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="todos">Todos</option>{OPTIONS.estatus.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
      <div className="field"><label htmlFor="type">Tipo</label><select id="type" value={type} onChange={(event) => { setType(event.target.value); setPage(1); }}><option value="todos">Todos</option>{OPTIONS.tipo.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
      <div className="field"><label htmlFor="sort">Ordenar</label><select id="sort" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}><option value="recent">Alta más reciente</option><option value="name">Nombre</option><option value="amount">Mayor aportación</option></select></div>
    </section>
    <section className="card">{visible.length ? <><div className="table-wrap"><table><thead><tr><th>Padrino</th><th>Contacto</th><th>Ubicación</th><th>Aportación</th><th>Alta</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{visible.map((item) => <tr key={item.id}><td><div className="table-name"><Link className="table-link" href={`/padrinos/${item.id}`}>{padrinoName(item)}</Link><span>{item.tipo === "empresa" ? "Empresa" : "Persona física"}{item.rfc ? ` · ${item.rfc}` : ""}</span></div></td><td><div className="table-name"><span>{item.email}</span><span>{item.telefono}</span></div></td><td>{item.municipio}, {item.estado}</td><td>{formatCurrency(item.aportacion)}<br /><small>{OPTIONS.periodicidad.find((option) => option.value === item.periodicidad)?.label}</small></td><td>{formatDate(item.fecha_alta)}</td><td><StatusBadge status={item.estatus} /></td><td><div className="table-actions"><Link className="button button-secondary button-small" href={`/padrinos/${item.id}`}>Editar</Link><button className={`button button-small ${item.estatus === "inactivo" ? "button-primary" : "button-danger"}`} onClick={() => void toggle(item)}>{item.estatus === "inactivo" ? "Reactivar" : "Desactivar"}</button></div></td></tr>)}</tbody></table></div><div className="pagination"><span>Mostrando {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} de {filtered.length}</span><div><button className="button button-secondary button-small" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label="Página anterior"><ChevronLeft /></button><span className="page-number">{currentPage} / {totalPages}</span><button className="button button-secondary button-small" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)} aria-label="Página siguiente"><ChevronRight /></button></div></div></> : <EmptyState title="No encontramos padrinos" description="Ajusta los filtros o registra un padrino nuevo." action={<Link className="button button-primary" href="/padrinos/nuevo"><Plus />Nuevo padrino</Link>} />}</section>
  </>;
}
