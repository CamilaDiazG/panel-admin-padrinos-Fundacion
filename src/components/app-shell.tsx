"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { BarChart3, Home, LogOut, Menu, RotateCcw, Upload, Users, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { usePadrinos } from "@/components/padrinos-provider";

const links = [
  { href: "/", label: "Resumen", icon: Home },
  { href: "/padrinos", label: "Padrinos", icon: Users },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/importar", label: "Importar", icon: Upload },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { demoMode, resetDemo } = usePadrinos();

  async function logout() {
    if (!demoMode) await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="app-shell">
      <button className="mobile-menu" aria-label="Abrir menú" onClick={() => setOpen(true)}><Menu /></button>
      {open && <button className="sidebar-scrim" aria-label="Cerrar menú" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand sidebar-brand">
          <Image className="sidebar-logo" src="/logo-fundacion.png" alt="Fundación Juntos por los Demás" width={205} height={100} priority />
          <button className="sidebar-close" aria-label="Cerrar menú" onClick={() => setOpen(false)}><X /></button>
        </div>
        <nav aria-label="Navegación principal">
          {links.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return <Link key={href} href={href} className={active ? "active" : ""} onClick={() => setOpen(false)}><Icon aria-hidden="true" />{label}</Link>;
          })}
        </nav>
        <div className="sidebar-footer">
          {demoMode && (
            <>
              <span className="demo-pill">Modo demostración</span>
              <button className="nav-button" onClick={resetDemo}><RotateCcw aria-hidden="true" />Restaurar datos</button>
            </>
          )}
          <button className="nav-button" onClick={logout}><LogOut aria-hidden="true" />Cerrar sesión</button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
