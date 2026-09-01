"use client";

import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, LoaderCircle, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { usePadrinos } from "@/components/padrinos-provider";
import { PageHeader } from "@/components/ui";
import { padrinoName, padrinoSchema, type ImportIssue, type PadrinoInput } from "@/lib/padrinos";
import { downloadIssues, downloadTemplate, parseSpreadsheet } from "@/lib/spreadsheet";

export default function ImportPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { importPadrinos } = usePadrinos();
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<PadrinoInput[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ inserted: number; issues: ImportIssue[] }>();
  const validCount = rows.filter((row) => padrinoSchema.safeParse(row).success).length;

  async function selectFile(file?: File) {
    setError(""); setRows([]); setResult(undefined);
    if (!file) return;
    if (!/\.(xlsx|csv)$/i.test(file.name)) return setError("Selecciona un archivo .xlsx o .csv");
    if (file.size > 10 * 1024 * 1024) return setError("El archivo supera el límite de 10 MB");
    try {
      const parsed = parseSpreadsheet(await file.arrayBuffer());
      if (!parsed.rows.length) throw new Error("El archivo está vacío");
      if (parsed.rows.length > 5000) throw new Error("El archivo supera el máximo de 5,000 filas");
      setFileName(file.name); setRows(parsed.rows); setHeaders(parsed.headers);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No fue posible leer el archivo"); }
  }

  async function runImport() {
    setImporting(true); setError("");
    try {
      const response = await importPadrinos(rows);
      setResult({ inserted: response.inserted.length, issues: response.issues });
      setRows([]);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No fue posible completar la importación"); }
    finally { setImporting(false); }
  }

  return <><PageHeader eyebrow="Carga masiva" title="Importar padrinos" description="Carga hasta 5,000 registros desde Excel o CSV. Los errores y duplicados no detienen las filas válidas." actions={<button className="button button-secondary" onClick={downloadTemplate}><Download />Descargar plantilla</button>} />
    {error && <div className="alert" role="alert"><AlertTriangle />{error}</div>}
    {result && <div className={`alert ${result.issues.length ? "alert-info" : "alert-success"}`} role="status"><CheckCircle2 /><span><strong>Importación terminada:</strong> {result.inserted} registros agregados y {result.issues.length} rechazados.{result.issues.length > 0 && <button className="inline-button" onClick={() => downloadIssues(result.issues)}>Descargar incidencias</button>}</span></div>}
    <section className="card import-card">
      {!rows.length ? <button className="dropzone" onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void selectFile(event.dataTransfer.files[0]); }}><span className="dropzone-icon"><Upload /></span><strong>Arrastra tu archivo aquí</strong><span>o haz clic para seleccionar `.xlsx` o `.csv`</span><small>Máximo 10 MB · 5,000 filas</small></button> : <>
        <div className="import-summary"><div><FileSpreadsheet /><span><strong>{fileName}</strong><small>{rows.length} filas · {headers.length} columnas reconocidas</small></span></div><button className="button button-secondary button-small" onClick={() => { setRows([]); setFileName(""); }}>Cambiar archivo</button></div>
        <div className="preview-stats"><span className="status-badge status-active">● {validCount} filas con formato válido</span>{rows.length - validCount > 0 && <span className="status-badge status-inactive">■ {rows.length - validCount} filas con errores</span>}</div>
        <div className="table-wrap"><table><thead><tr><th>Fila</th><th>Padrino</th><th>Correo</th><th>Ubicación</th><th>Aportación</th><th>Validación</th></tr></thead><tbody>{rows.slice(0, 8).map((row, index) => { const validation = padrinoSchema.safeParse(row); return <tr key={index}><td>{index + 2}</td><td>{padrinoName(row) || "—"}</td><td>{row.email || "—"}</td><td>{row.municipio || "—"}, {row.estado || "—"}</td><td>{Number(row.aportacion || 0).toLocaleString("es-MX")}</td><td>{validation.success ? <span className="status-badge status-active">● Válida</span> : <span className="validation-error" title={validation.error.issues.map((item) => item.message).join("; ")}>Revisar datos</span>}</td></tr>; })}</tbody></table></div>
        {rows.length > 8 && <p className="preview-note">Vista previa de 8 filas. Se procesará el archivo completo.</p>}
        <div className="import-actions"><button className="button button-primary" onClick={() => void runImport()} disabled={importing}>{importing ? <LoaderCircle className="spin" /> : <Upload />}{importing ? "Importando…" : `Importar ${rows.length} filas`}</button></div>
      </>}
      <input ref={inputRef} hidden type="file" accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" onChange={(event) => void selectFile(event.target.files?.[0])} />
    </section>
  </>;
}
