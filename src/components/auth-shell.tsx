import Image from "next/image";
import type { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <section className="auth-hero" aria-label="Fundación Juntos por los Demás">
        <div className="auth-logo">
          <Image src="/logo-fundacion.png" alt="Fundación Juntos por los Demás" width={360} height={176} priority />
        </div>
        <div className="auth-hero-copy">
          <h1>Pequeños pasos, grandes cambios.</h1>
          <p>Un espacio seguro para cuidar la relación con quienes hacen posible que más niñas, niños y jóvenes reciban atención.</p>
        </div>
        <span className="auth-quote">Panel administrativo de padrinos</span>
      </section>
      <section className="auth-panel">{children}</section>
    </main>
  );
}
