"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { cartaSchema, validateCartaFile, type CartaInput, type CartaNavidad } from "@/lib/cartas";

const DB_NAME = "juntos-cartas-demo-v1";
const STORE_NAME = "cartas";

interface CartasContextValue {
  cartas: CartaNavidad[];
  loading: boolean;
  error: string;
  createCarta: (input: CartaInput, file: File) => Promise<CartaNavidad>;
  updateEstado: (id: string, estado: CartaInput["estado"]) => Promise<void>;
}

const CartasContext = createContext<CartasContextValue | undefined>(undefined);

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("No fue posible abrir el almacenamiento local"));
  });
}

async function readCartas(): Promise<CartaNavidad[]> {
  const database = await openDatabase();
  return await new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result as CartaNavidad[]);
    request.onerror = () => reject(request.error ?? new Error("No fue posible consultar las cartas"));
    transaction.oncomplete = () => database.close();
  });
}

async function persistCarta(carta: CartaNavidad): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(carta);
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onerror = () => { database.close(); reject(transaction.error ?? new Error("No fue posible guardar la carta")); };
  });
}

export function CartasProvider({ children }: { children: ReactNode }) {
  const [cartas, setCartas] = useState<CartaNavidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    readCartas()
      .then((items) => { if (!cancelled) setCartas(items); })
      .catch(() => { if (!cancelled) setError("No fue posible consultar las cartas guardadas en este navegador."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const createCarta = useCallback(async (raw: CartaInput, file: File) => {
    const input = cartaSchema.parse(raw);
    const fileError = validateCartaFile(file);
    if (fileError) throw new Error(fileError);
    const now = new Date().toISOString();
    const carta: CartaNavidad = {
      ...input,
      id: crypto.randomUUID(),
      archivo_nombre: file.name,
      archivo_tipo: file.type || "application/octet-stream",
      archivo_tamano: file.size,
      archivo: file,
      created_at: now,
      updated_at: now,
    };
    await persistCarta(carta);
    setCartas((current) => [carta, ...current]);
    return carta;
  }, []);

  const updateEstado = useCallback(async (id: string, estado: CartaInput["estado"]) => {
    const current = cartas.find((item) => item.id === id);
    if (!current) throw new Error("La carta no existe");
    const today = new Date().toISOString().slice(0, 10);
    const updated: CartaNavidad = {
      ...current,
      estado,
      fecha_envio: estado !== "pendiente" && !current.fecha_envio ? today : current.fecha_envio,
      updated_at: new Date().toISOString(),
    };
    cartaSchema.parse(updated);
    await persistCarta(updated);
    setCartas((items) => items.map((item) => item.id === id ? updated : item));
  }, [cartas]);

  const value = useMemo(() => ({ cartas, loading, error, createCarta, updateEstado }), [cartas, loading, error, createCarta, updateEstado]);
  return <CartasContext.Provider value={value}>{children}</CartasContext.Provider>;
}

export function useCartas() {
  const context = useContext(CartasContext);
  if (!context) throw new Error("useCartas debe usarse dentro de CartasProvider");
  return context;
}
