import { HeartHandshake } from "lucide-react";
import type { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <section className="auth-hero" aria-label="Fundación Juntos por los Demás">
        <div className="brand">
          <span className="brand-mark"><HeartHandshake aria-hidden="true" /></span>
          <span><strong>Juntos por los Demás</strong><small>Fundación A.C.</small></span>
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
