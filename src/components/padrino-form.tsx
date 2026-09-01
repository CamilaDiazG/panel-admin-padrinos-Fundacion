"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, LoaderCircle, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { usePadrinos } from "@/components/padrinos-provider";
import { ESTADOS_MEXICO, OPTIONS } from "@/lib/constants";
import { isDuplicate, padrinoDefaults, padrinoSchema, type Padrino, type PadrinoInput } from "@/lib/padrinos";

function ErrorText({ message }: { message?: string }) {
  return message ? <span className="field-error" role="alert">{message}</span> : null;
}

function SelectOptions({ items }: { items: ReadonlyArray<{ readonly value: string; readonly label: string }> }) {
  return <>{items.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</>;
}

export function PadrinoForm({ padrino }: { padrino?: Padrino }) {
  const router = useRouter();
  const { padrinos, createPadrino, updatePadrino } = usePadrinos();
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, control, formState: { errors, isDirty } } = useForm<PadrinoInput>({
    resolver: zodResolver(padrinoSchema),
    defaultValues: padrino ? { ...padrino } : padrinoDefaults,
  });
  const tipo = useWatch({ control, name: "tipo" });
  const watchedEmail = useWatch({ control, name: "email" });
  const watchedRfc = useWatch({ control, name: "rfc" });
  const duplicate = useMemo(() => {
    if (!watchedEmail && !watchedRfc) return undefined;
    return isDuplicate({ ...padrinoDefaults, email: watchedEmail ?? "", rfc: watchedRfc ?? "" }, padrinos, padrino?.id);
  }, [watchedEmail, watchedRfc, padrinos, padrino?.id]);

  async function submit(values: PadrinoInput) {
    setSaving(true);
    setSubmitError("");
    try {
      const saved = padrino ? await updatePadrino(padrino.id, values) : await createPadrino(values);
      router.push(`/padrinos/${saved.id}?guardado=1`);
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : "No fue posible guardar el registro");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      {submitError && <div className="alert" role="alert"><AlertTriangle size={19} />{submitError}</div>}
      {duplicate && <div className="alert alert-info" role="status"><AlertTriangle size={19} /><span>Posible duplicado: <strong>{duplicate.email}</strong>. Revisa el padrón antes de guardar.</span></div>}
      <div className="card">
        <section className="form-section"><h2>Identidad</h2><p>Información principal de la persona o empresa.</p><div className="form-grid">
          <div className="field"><label className="required" htmlFor="tipo">Tipo de padrino</label><select id="tipo" {...register("tipo")}><SelectOptions items={OPTIONS.tipo} /></select><ErrorText message={errors.tipo?.message} /></div>
          {tipo === "persona" ? <>
            <div className="field"><label className="required" htmlFor="nombres">Nombre(s)</label><input id="nombres" {...register("nombres")} autoComplete="given-name" /><ErrorText message={errors.nombres?.message} /></div>
            <div className="field"><label className="required" htmlFor="apellido_paterno">Apellido paterno</label><input id="apellido_paterno" {...register("apellido_paterno")} autoComplete="family-name" /><ErrorText message={errors.apellido_paterno?.message} /></div>
            <div className="field"><label htmlFor="apellido_materno">Apellido materno</label><input id="apellido_materno" {...register("apellido_materno")} /></div>
          </> : <>
            <div className="field field-span-2"><label className="required" htmlFor="razon_social">Razón social</label><input id="razon_social" {...register("razon_social")} /><ErrorText message={errors.razon_social?.message} /></div>
            <div className="field"><label htmlFor="contacto_responsable">Persona de contacto</label><input id="contacto_responsable" {...register("contacto_responsable")} /></div>
          </>}
          <div className="field"><label htmlFor="rfc">RFC</label><input id="rfc" {...register("rfc")} maxLength={13} style={{ textTransform: "uppercase" }} /><span className="field-hint">Opcional; se usa para detectar duplicados.</span><ErrorText message={errors.rfc?.message} /></div>
        </div></section>

        <section className="form-section"><h2>Contacto</h2><p>Medios autorizados para comunicarse con el padrino.</p><div className="form-grid">
          <div className="field"><label className="required" htmlFor="email">Correo electrónico</label><input id="email" type="email" {...register("email")} autoComplete="email" /><ErrorText message={errors.email?.message} /></div>
          <div className="field"><label className="required" htmlFor="telefono">Teléfono</label><input id="telefono" type="tel" {...register("telefono")} autoComplete="tel" /><ErrorText message={errors.telefono?.message} /></div>
          <div className="field"><label htmlFor="telefono_alterno">Teléfono alterno</label><input id="telefono_alterno" type="tel" {...register("telefono_alterno")} /></div>
          <div className="field"><label className="required" htmlFor="canal_preferido">Canal preferido</label><select id="canal_preferido" {...register("canal_preferido")}><SelectOptions items={OPTIONS.canal} /></select></div>
        </div></section>

        <section className="form-section"><h2>Domicilio</h2><p>Ubicación para segmentación y contacto institucional.</p><div className="form-grid">
          <div className="field"><label className="required" htmlFor="pais">País</label><input id="pais" {...register("pais")} autoComplete="country-name" /><ErrorText message={errors.pais?.message} /></div>
          <div className="field"><label className="required" htmlFor="estado">Estado</label><select id="estado" {...register("estado")}><option value="">Selecciona…</option>{ESTADOS_MEXICO.map((estado) => <option key={estado}>{estado}</option>)}</select><ErrorText message={errors.estado?.message} /></div>
          <div className="field"><label className="required" htmlFor="municipio">Municipio</label><input id="municipio" {...register("municipio")} autoComplete="address-level2" /><ErrorText message={errors.municipio?.message} /></div>
          <div className="field"><label className="required" htmlFor="codigo_postal">Código postal</label><input id="codigo_postal" inputMode="numeric" maxLength={5} {...register("codigo_postal")} autoComplete="postal-code" /><ErrorText message={errors.codigo_postal?.message} /></div>
          <div className="field"><label htmlFor="colonia">Colonia</label><input id="colonia" {...register("colonia")} autoComplete="address-level3" /></div>
          <div className="field"><label htmlFor="calle">Calle</label><input id="calle" {...register("calle")} autoComplete="street-address" /></div>
          <div className="field"><label htmlFor="numero_exterior">Número exterior</label><input id="numero_exterior" {...register("numero_exterior")} /></div>
          <div className="field"><label htmlFor="numero_interior">Número interior</label><input id="numero_interior" {...register("numero_interior")} /></div>
        </div></section>

        <section className="form-section"><h2>Patrocinio y seguimiento</h2><p>Compromiso declarado; no representa movimientos contables.</p><div className="form-grid">
          <div className="field"><label className="required" htmlFor="fecha_alta">Fecha de alta</label><input id="fecha_alta" type="date" {...register("fecha_alta")} /><ErrorText message={errors.fecha_alta?.message} /></div>
          <div className="field"><label className="required" htmlFor="aportacion">Aportación (MXN)</label><input id="aportacion" type="number" min="0" step="0.01" {...register("aportacion", { valueAsNumber: true })} /><ErrorText message={errors.aportacion?.message} /></div>
          <div className="field"><label className="required" htmlFor="periodicidad">Periodicidad</label><select id="periodicidad" {...register("periodicidad")}><SelectOptions items={OPTIONS.periodicidad} /></select></div>
          <div className="field"><label className="required" htmlFor="metodo_pago">Método de pago</label><select id="metodo_pago" {...register("metodo_pago")}><SelectOptions items={OPTIONS.metodo} /></select></div>
          <div className="field"><label className="required" htmlFor="origen">Origen del contacto</label><select id="origen" {...register("origen")}><SelectOptions items={OPTIONS.origen} /></select></div>
          <div className="field"><label htmlFor="proximo_seguimiento">Próximo seguimiento</label><input id="proximo_seguimiento" type="date" {...register("proximo_seguimiento")} /><ErrorText message={errors.proximo_seguimiento?.message} /></div>
          <div className="field"><label className="required" htmlFor="estatus">Estado</label><select id="estatus" {...register("estatus")}><SelectOptions items={OPTIONS.estatus} /></select></div>
          <div className="field field-span-3"><label htmlFor="observaciones">Observaciones</label><textarea id="observaciones" {...register("observaciones")} placeholder="Notas administrativas relevantes" /><ErrorText message={errors.observaciones?.message} /></div>
        </div></section>
      </div>
      <div className="form-actions"><Link className="button button-secondary" href="/padrinos">Cancelar</Link><button className="button button-primary" type="submit" disabled={saving || (!!padrino && !isDirty)}>{saving ? <LoaderCircle className="spin" /> : <Save />}{saving ? "Guardando…" : "Guardar padrino"}</button></div>
    </form>
  );
}
