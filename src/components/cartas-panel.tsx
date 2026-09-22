"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, FileUp, Gift, LoaderCircle, Plus, ShieldCheck, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useCartas } from "@/components/cartas-provider";
import {
  CARTA_ESTADOS,
  CARTA_FILE_ACCEPT,
  CARTA_MEDIOS,
  cartaDefaults,
  cartaEstadoLabel,
  cartaMedioLabel,
  cartaSchema,
  validateCartaFile,
  type CartaInput,
  type CartaNavidad,
} from "@/lib/cartas";
import { formatDate } from "@/lib/format";

function formatFileSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
}

function openCartaFile(carta: CartaNavidad) {
  const url = URL.createObjectURL(carta.archivo);
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function cartaStatusClass(estado: CartaInput["estado"]): string {
  return estado === "pendiente" ? "status-pending" : "status-active";
}

export function CartasPanel({ padrinoId }: { padrinoId: string }) {
  const { cartas, loading, error, createCarta, updateEstado } = useCartas();
  const [showForm, setShowForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const defaults = useMemo(() => ({ ...cartaDefaults, padrino_id: padrinoId }), [padrinoId]);
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<CartaInput>({
    resolver: zodResolver(cartaSchema),
    defaultValues: defaults,
  });
  const selectedStatus = useWatch({ control, name: "estado" });
  const padrinoCartas = cartas
    .filter((item) => item.padrino_id === padrinoId)
    .sort((a, b) => b.anio - a.anio || b.created_at.localeCompare(a.created_at));

  function onFileChange(file: File | null) {
    setSelectedFile(file);
    setFileError(file ? validateCartaFile(file) ?? "" : "Adjunta la carta escaneada");
  }

  async function submit(values: CartaInput) {
    setSubmitError("");
    setSuccess("");
    if (!selectedFile) {
      setFileError("Adjunta la carta escaneada");
      return;
    }
    const validationError = validateCartaFile(selectedFile);
    if (validationError) {
      setFileError(validationError);
      return;
    }
    setSaving(true);
    try {
      await createCarta(values, selectedFile);
      setSuccess("La carta y su archivo se guardaron correctamente.");
      setShowForm(false);
      setSelectedFile(null);
      setFileError("");
      reset(defaults);
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : "No fue posible guardar la carta");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(id: string, estado: CartaInput["estado"]) {
    setUpdatingId(id);
    setSubmitError("");
    try {
      await updateEstado(id, estado);
      setSuccess("El estado de la carta se actualizó.");
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : "No fue posible actualizar el estado");
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <section className="card letters-panel" aria-labelledby="letters-title">
      <div className="card-header">
        <div><h2 id="letters-title"><Gift size={19} /> Cartas de Navidad</h2><p>Control anual de cartas, deseos y envío al padrino.</p></div>
        <button className="button button-primary" type="button" onClick={() => { setShowForm((value) => !value); setSuccess(""); }}>
          {showForm ? <X /> : <Plus />}{showForm ? "Cerrar" : "Agregar carta"}
        </button>
      </div>

      <div className="letters-privacy"><ShieldCheck size={18} /><span><strong>Prototipo local:</strong> el archivo se guarda únicamente en este navegador. Al conectar Oracle se almacenará en un espacio privado con acceso para administradores.</span></div>
      {error && <div className="alert" role="alert">{error}</div>}
      {submitError && <div className="alert" role="alert">{submitError}</div>}
      {success && <div className="alert alert-success" role="status">{success}</div>}

      {showForm && <form className="letter-form" onSubmit={handleSubmit(submit)} noValidate>
        <div className="form-grid">
          <div className="field"><label className="required" htmlFor="letter-year">Año de campaña</label><input id="letter-year" type="number" min="2020" max="2100" {...register("anio", { valueAsNumber: true })} />{errors.anio && <span className="field-error">{errors.anio.message}</span>}</div>
          <div className="field field-span-2"><label className="required" htmlFor="letter-patient">Nombre del paciente</label><input id="letter-patient" {...register("paciente_nombre")} autoComplete="off" />{errors.paciente_nombre && <span className="field-error">{errors.paciente_nombre.message}</span>}</div>
          <div className="field"><label className="required" htmlFor="letter-wish-1">Regalo 1</label><input id="letter-wish-1" {...register("deseo_1")} />{errors.deseo_1 && <span className="field-error">{errors.deseo_1.message}</span>}</div>
          <div className="field"><label className="required" htmlFor="letter-wish-2">Regalo 2</label><input id="letter-wish-2" {...register("deseo_2")} />{errors.deseo_2 && <span className="field-error">{errors.deseo_2.message}</span>}</div>
          <div className="field"><label className="required" htmlFor="letter-wish-3">Regalo 3</label><input id="letter-wish-3" {...register("deseo_3")} />{errors.deseo_3 && <span className="field-error">{errors.deseo_3.message}</span>}</div>
          <div className="field"><label className="required" htmlFor="letter-channel">Medio de envío</label><select id="letter-channel" {...register("medio_envio")}>{CARTA_MEDIOS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
          <div className="field"><label className="required" htmlFor="letter-status">Estado</label><select id="letter-status" {...register("estado")}>{CARTA_ESTADOS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
          {selectedStatus !== "pendiente" && <div className="field"><label className="required" htmlFor="letter-sent-date">Fecha de envío</label><input id="letter-sent-date" type="date" {...register("fecha_envio")} />{errors.fecha_envio && <span className="field-error">{errors.fecha_envio.message}</span>}</div>}
          <div className="field field-span-3"><label className="required" htmlFor="letter-file">Carta escaneada</label><input id="letter-file" type="file" accept={CARTA_FILE_ACCEPT} onChange={(event) => onFileChange(event.target.files?.[0] ?? null)} /><span className="field-hint">PDF, JPG, PNG o WEBP; máximo 10 MB.</span>{fileError && <span className="field-error" role="alert">{fileError}</span>}</div>
          <div className="field field-span-3"><label htmlFor="letter-notes">Observaciones</label><textarea id="letter-notes" {...register("observaciones")} placeholder="Notas sobre el envío o seguimiento" />{errors.observaciones && <span className="field-error">{errors.observaciones.message}</span>}</div>
        </div>
        <div className="letter-form-actions"><button className="button button-secondary" type="button" onClick={() => setShowForm(false)}>Cancelar</button><button className="button button-primary" type="submit" disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <FileUp />}{saving ? "Guardando…" : "Guardar carta"}</button></div>
      </form>}

      {loading ? <div className="state-panel"><LoaderCircle className="spin" /><p>Cargando cartas…</p></div> : padrinoCartas.length === 0 ? <div className="state-panel"><Gift /><h3>Sin cartas registradas</h3><p>Agrega la carta escaneada de la campaña navideña para comenzar su seguimiento.</p></div> : <div className="letters-list">
        {padrinoCartas.map((carta) => <article className="letter-item" key={carta.id}>
          <div className="letter-year"><span>Campaña</span><strong>{carta.anio}</strong></div>
          <div className="letter-summary"><div className="letter-title"><h3>{carta.paciente_nombre}</h3><span className={`status-badge ${cartaStatusClass(carta.estado)}`}>{carta.estado === "pendiente" ? "◆" : "●"} {cartaEstadoLabel(carta.estado)}</span></div><ol><li>{carta.deseo_1}</li><li>{carta.deseo_2}</li><li>{carta.deseo_3}</li></ol><p>{cartaMedioLabel(carta.medio_envio)} · {carta.fecha_envio ? `Enviada ${formatDate(carta.fecha_envio)}` : "Aún no enviada"}</p></div>
          <div className="letter-file"><button className="button button-secondary button-small" type="button" onClick={() => openCartaFile(carta)}><ExternalLink />Ver archivo</button><small title={carta.archivo_nombre}>{carta.archivo_nombre}</small><small>{formatFileSize(carta.archivo_tamano)}</small></div>
          <div className="field letter-status-control"><label htmlFor={`letter-state-${carta.id}`}>Actualizar estado</label><select id={`letter-state-${carta.id}`} value={carta.estado} disabled={updatingId === carta.id} onChange={(event) => void changeStatus(carta.id, event.target.value as CartaInput["estado"])}>{CARTA_ESTADOS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
        </article>)}
      </div>}
    </section>
  );
}
