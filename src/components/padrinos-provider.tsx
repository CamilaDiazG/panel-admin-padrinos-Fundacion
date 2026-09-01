"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEMO_PADRINOS } from "@/lib/demo-data";
import {
  isDuplicate,
  normalizePadrino,
  padrinoSchema,
  type ImportIssue,
  type ImportResult,
  type Padrino,
  type PadrinoInput,
} from "@/lib/padrinos";
import { isDemoMode } from "@/lib/supabase/config";

const STORAGE_KEY = "juntos-padrinos-demo-v1";

interface PadrinosContextValue {
  padrinos: Padrino[];
  loading: boolean;
  error: string;
  demoMode: boolean;
  refresh: () => Promise<void>;
  createPadrino: (input: PadrinoInput) => Promise<Padrino>;
  updatePadrino: (id: string, input: PadrinoInput) => Promise<Padrino>;
  importPadrinos: (rows: unknown[]) => Promise<ImportResult>;
  resetDemo: () => void;
}

const PadrinosContext = createContext<PadrinosContextValue | undefined>(undefined);

function readDemo(): Padrino[] {
  if (typeof window === "undefined") return DEMO_PADRINOS;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) as Padrino[] : DEMO_PADRINOS;
  } catch {
    return DEMO_PADRINOS;
  }
}

function persistDemo(items: Padrino[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function PadrinosProvider({ children }: { children: ReactNode }) {
  const [padrinos, setPadrinos] = useState<Padrino[]>(() => isDemoMode ? readDemo() : []);
  const [loading, setLoading] = useState(!isDemoMode);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (isDemoMode) {
        setPadrinos(readDemo());
      } else {
        const response = await fetch("/api/padrinos", { cache: "no-store" });
        if (!response.ok) throw new Error("No fue posible consultar el padrón");
        setPadrinos(await response.json() as Padrino[]);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isDemoMode) return;
    let cancelled = false;
    fetch("/api/padrinos", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("No fue posible consultar el padrón");
        return await response.json() as Padrino[];
      })
      .then((items) => { if (!cancelled) setPadrinos(items); })
      .catch((reason: unknown) => { if (!cancelled) setError(reason instanceof Error ? reason.message : "Ocurrió un error inesperado"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const createPadrino = useCallback(async (raw: PadrinoInput) => {
    const input = normalizePadrino(padrinoSchema.parse(raw));
    if (isDemoMode) {
      const duplicate = isDuplicate(input, padrinos);
      if (duplicate) throw new Error("Ya existe un padrino con el mismo RFC o correo electrónico");
      const now = new Date().toISOString();
      const created: Padrino = { ...input, id: crypto.randomUUID(), created_at: now, updated_at: now, created_by: "demo@fundacion.org", updated_by: "demo@fundacion.org" };
      const next = [created, ...padrinos];
      setPadrinos(next);
      persistDemo(next);
      return created;
    }
    const response = await fetch("/api/padrinos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "No fue posible crear el padrino");
    setPadrinos((current) => [body as Padrino, ...current]);
    return body as Padrino;
  }, [padrinos]);

  const updatePadrino = useCallback(async (id: string, raw: PadrinoInput) => {
    const input = normalizePadrino(padrinoSchema.parse(raw));
    if (isDemoMode) {
      const duplicate = isDuplicate(input, padrinos, id);
      if (duplicate) throw new Error("Ya existe otro padrino con el mismo RFC o correo electrónico");
      const current = padrinos.find((item) => item.id === id);
      if (!current) throw new Error("El padrino no existe");
      const updated: Padrino = { ...current, ...input, updated_at: new Date().toISOString(), updated_by: "demo@fundacion.org" };
      const next = padrinos.map((item) => item.id === id ? updated : item);
      setPadrinos(next);
      persistDemo(next);
      return updated;
    }
    const response = await fetch(`/api/padrinos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "No fue posible guardar los cambios");
    setPadrinos((current) => current.map((item) => item.id === id ? body as Padrino : item));
    return body as Padrino;
  }, [padrinos]);

  const importPadrinos = useCallback(async (rows: unknown[]): Promise<ImportResult> => {
    if (isDemoMode) {
      const inserted: Padrino[] = [];
      const issues: ImportIssue[] = [];
      const working = [...padrinos];
      rows.forEach((row, index) => {
        const parsed = padrinoSchema.safeParse(row);
        if (!parsed.success) {
          issues.push({ fila: index + 2, motivo: parsed.error.issues.map((item) => item.message).join("; ") });
          return;
        }
        const normalized = normalizePadrino(parsed.data);
        if (isDuplicate(normalized, working)) {
          issues.push({ fila: index + 2, motivo: "RFC o correo duplicado", email: normalized.email, rfc: normalized.rfc });
          return;
        }
        const now = new Date().toISOString();
        const item: Padrino = { ...normalized, id: crypto.randomUUID(), created_at: now, updated_at: now, created_by: "demo@fundacion.org", updated_by: "demo@fundacion.org" };
        working.unshift(item);
        inserted.push(item);
      });
      setPadrinos(working);
      persistDemo(working);
      return { inserted, issues };
    }
    const response = await fetch("/api/importar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "No fue posible importar el archivo");
    await refresh();
    return body as ImportResult;
  }, [padrinos, refresh]);

  const resetDemo = useCallback(() => {
    if (!isDemoMode) return;
    persistDemo(DEMO_PADRINOS);
    setPadrinos(DEMO_PADRINOS);
  }, []);

  const value = useMemo(() => ({ padrinos, loading, error, demoMode: isDemoMode, refresh, createPadrino, updatePadrino, importPadrinos, resetDemo }), [padrinos, loading, error, refresh, createPadrino, updatePadrino, importPadrinos, resetDemo]);
  return <PadrinosContext.Provider value={value}>{children}</PadrinosContext.Provider>;
}

export function usePadrinos() {
  const context = useContext(PadrinosContext);
  if (!context) throw new Error("usePadrinos debe usarse dentro de PadrinosProvider");
  return context;
}
