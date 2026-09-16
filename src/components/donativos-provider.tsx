"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEMO_DONATIONS } from "@/lib/demo-donativos";
import { donationSchema, type Donation, type DonationInput } from "@/lib/donativos";

const STORAGE_KEY = "juntos-donativos-demo-v1";

interface DonationsContextValue {
  donations: Donation[];
  createDonation: (input: DonationInput) => Donation;
  cancelDonation: (id: string) => void;
  resetDonations: () => void;
}

const DonationsContext = createContext<DonationsContextValue | undefined>(undefined);

function readStored(): Donation[] {
  if (typeof window === "undefined") return DEMO_DONATIONS;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) as Donation[] : DEMO_DONATIONS;
  } catch {
    return DEMO_DONATIONS;
  }
}

function persist(items: Donation[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function DonationsProvider({ children }: { children: ReactNode }) {
  // Keep server and initial client output deterministic; localStorage is an
  // external browser source and is applied only after React hydrates the page.
  const [donations, setDonations] = useState<Donation[]>(DEMO_DONATIONS);

  useEffect(() => {
    const timer = window.setTimeout(() => setDonations(readStored()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const createDonation = useCallback((raw: DonationInput) => {
    const input = donationSchema.parse(raw);
    const item: Donation = { ...input, id: crypto.randomUUID(), estatus: "registrado", created_at: new Date().toISOString() };
    setDonations((current) => {
      const next = [item, ...current];
      persist(next);
      return next;
    });
    return item;
  }, []);

  const cancelDonation = useCallback((id: string) => {
    setDonations((current) => {
      const next = current.map((item) => item.id === id ? { ...item, estatus: "cancelado" as const, cancelled_at: new Date().toISOString() } : item);
      persist(next);
      return next;
    });
  }, []);

  const resetDonations = useCallback(() => {
    persist(DEMO_DONATIONS);
    setDonations(DEMO_DONATIONS);
  }, []);

  const value = useMemo(() => ({ donations, createDonation, cancelDonation, resetDonations }), [donations, createDonation, cancelDonation, resetDonations]);
  return <DonationsContext.Provider value={value}>{children}</DonationsContext.Provider>;
}

export function useDonations() {
  const context = useContext(DonationsContext);
  if (!context) throw new Error("useDonations debe usarse dentro de DonationsProvider");
  return context;
}
