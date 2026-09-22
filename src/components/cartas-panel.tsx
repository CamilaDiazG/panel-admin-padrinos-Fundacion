"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, FileUp, Gift, LoaderCircle, Plus, ShieldCheck, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useCartas } from "@/components/cartas-provider";
import {
  CARTA_FILE_ACCEPT,
  cartaDefaults,
  cartaSchema,
  cartaStatus,
  validateCartaFile,
  type CartaInput,
  type CartaNavidad,
} from "@/lib/cartas";

function formatFileSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
}

function openCartaFile(carta: CartaNavidad) {
  if (!carta.archivo) return;
  const url = URL.createObjectURL(carta.archivo);
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function CartasPanel({ padrinoId }: { padrinoId: string }) {
  const { cartas, loading, error, createCarta, updateSeguimiento } = useCartas();
  const [showForm, setShowForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const defaults = useMemo(() => ({ ...cartaDefaults, padrino_id: padrinoId }), [padrinoId]);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CartaInput>({
    resolver: zodResolver(cartaSchema),
    defaultValues: defaults,
  });
  const padrinoCartas = cartas
    .filter((item) => item.padrino_id === padrinoId)
    .sort((a, b) => b.anio - a.anio || b.created_at.localeCompare(a.created_at));

  function onFileChange(file: File | null) {
    setSelectedFile(file);
    setFileError(file ? validateCartaFile(file) ?? "" : "");
  }

  async function submit(values: CartaInput) {
    setSubmitError("");
    setSuccess("");
    if (selectedFile) {
      const validationError = validateCartaFile(selectedFile);
      if (validationError) {
        setFileError(validationError);
        return;
      }
    }
    setSaving(true);
    try {
      await createCarta(values, selectedFile);
      setSuccess("El ahijado de posada se registró correctamente.");
      setShowForm(false);
      setSelectedFile(null);
      setFileError("");
      reset(defaults);
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : "No fue posible registrar al ahijado");
    } finally {
      setSaving(false);
    }
  }

  async function changeCheck(carta: CartaNavidad, field: "confirmo_regalo" | "regalos_recibidos", checked: boolean) {
    setUpdatingId(carta.id);
    setSubmitError("");
    setSuccess("");
    try {
      await updateSeguimiento(carta.id, {
        confirmo_regalo: field === "confirmo_regalo" ? checked : carta.confirmo_regalo,
        regalos_recibidos: field === "regalos_recibidos" ? checked : carta.regalos_recibidos,
      });
      setSuccess("El seguimiento del ahijado se actualizó.");
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : "No fue posible actualizar el seguimiento");
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <section className="card letters-panel" aria-labelledby="letters-title">
      <div className="card-header">
        <div><h2 id="letters-title"><Gift size={19} /> Ahijados de posada</h2><p>Control de los niños asignados a este padrino durante la campaña navideña.</p></div>
        <button className="button button-primary" type="button" onClick={() => { setShowForm((value) => !value); setSuccess(""); }}>
          {showForm ? <X /> : <Plus />}{showForm ? "Cerrar" : "Dar de alta ahijado"}
        </button>
      </div>

      <div className="letters-privacy"><ShieldCheck size={18} /><span>El escaneo es <strong>opcional</strong>. En este prototipo se guarda únicamente en el navegador; al conectar Oracle se almacenará en un espacio privado.</span></div>
      {error && <div className="alert" role="alert">{error}</div>}
      {submitError && <div className="alert" role="alert">{submitError}</div>}
      {success && <div className="alert alert-success" role="status">{success}</div>}

      {showForm && <form className="letter-form" onSubmit={handleSubmit(submit)} noValidate>
        <div className="form-grid">
          <div className="field"><label className="required" htmlFor="letter-year">Año de campaña</label><input id="letter-year" type="number" min="2020" max="2100" {...register("anio", { valueAsNumber: true })} />{errors.anio && <span className="field-error">{errors.anio.message}</span>}</div>
          <div className="field field-span-2"><label className="required" htmlFor="letter-patient">Nombre del ahijado</label><input id="letter-patient" {...register("paciente_nombre")} autoComplete="off" />{errors.paciente_nombre && <span className="field-error">{errors.paciente_nombre.message}</span>}</div>
          <div className="field"><label className="required" htmlFor="letter-wish-1">Regalo 1</label><input id="letter-wish-1" {...register("deseo_1")} />{errors.deseo_1 && <span className="field-error">{errors.deseo_1.message}</span>}</div>
          <div className="field"><label className="required" htmlFor="letter-wish-2">Regalo 2</label><input id="letter-wish-2" {...register("deseo_2")} />{errors.deseo_2 && <span className="field-error">{errors.deseo_2.message}</span>}</div>
          <div className="field"><label className="required" htmlFor="letter-wish-3">Regalo 3</label><input id="letter-wish-3" {...register("deseo_3")} />{errors.deseo_3 && <span className="field-error">{errors.deseo_3.message}</span>}</div>
          <label className="check-card"><input type="checkbox" {...register("confirmo_regalo")} /><span><strong>Confirmó que sí regalará</strong><small>El padrino aceptó participar.</small></span></label>
          <label className="check-card"><input type="checkbox" {...register("regalos_recibidos")} /><span><strong>Ya recibimos sus regalos</strong><small>Los regalos están en la fundación.</small></span></label>
          <div className="field field-span-3"><label htmlFor="letter-file">Carta escaneada (opcional)</label><input id="letter-file" type="file" accept={CARTA_FILE_ACCEPT} onChange={(event) => onFileChange(event.target.files?.[0] ?? null)} /><span className="field-hint">PDF, JPG, PNG o WEBP; máximo 10 MB.</span>{fileError && <span className="field-error" role="alert">{fileError}</span>}</div>
          <div className="field field-span-3"><label htmlFor="letter-notes">Observaciones</label><textarea id="letter-notes" {...register("observaciones")} placeholder="Notas sobre la entrega o seguimiento" />{errors.observaciones && <span className="field-error">{errors.observaciones.message}</span>}</div>
        </div>
        <div className="letter-form-actions"><button className="button button-secondary" type="button" onClick={() => setShowForm(false)}>Cancelar</button><button className="button button-primary" type="submit" disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <FileUp />}{saving ? "Guardando…" : "Guardar ahijado"}</button></div>
      </form>}

      {loading ? <div className="state-panel"><LoaderCircle className="spin" /><p>Cargando ahijados…</p></div> : padrinoCartas.length === 0 ? <div className="state-panel"><Gift /><h3>Sin ahijados registrados</h3><p>Da de alta al niño asignado a este padrino para comenzar el seguimiento.</p></div> : <div className="letters-list">
        {padrinoCartas.map((carta) => { const status = cartaStatus(carta); return <article className="letter-item" key={carta.id}>
          <div className="letter-year"><span>Campaña</span><strong>{carta.anio}</strong></div>
          <div className="letter-summary"><div className="letter-title"><h3>{carta.paciente_nombre}</h3><span className={`status-badge ${status.className}`}>{status.symbol} {status.label}</span></div><ol><li>{carta.deseo_1}</li><li>{carta.deseo_2}</li><li>{carta.deseo_3}</li></ol>{carta.observaciones && <p>{carta.observaciones}</p>}</div>
          <div className="letter-checks">
            <label><input type="checkbox" checked={carta.confirmo_regalo} disabled={updatingId === carta.id} onChange={(event) => void changeCheck(carta, "confirmo_regalo", event.target.checked)} /> Confirmó que regalará</label>
            <label><input type="checkbox" checked={carta.regalos_recibidos} disabled={updatingId === carta.id} onChange={(event) => void changeCheck(carta, "regalos_recibidos", event.target.checked)} /> Regalos recibidos</label>
          </div>
          <div className="letter-file">{carta.archivo ? <><button className="button button-secondary button-small" type="button" onClick={() => openCartaFile(carta)}><ExternalLink />Ver carta</button><small title={carta.archivo_nombre}>{carta.archivo_nombre}</small><small>{formatFileSize(carta.archivo_tamano)}</small></> : <span className="record-count">Sin archivo adjunto</span>}</div>
        </article>; })}
      </div>}
    </section>
  );
}
