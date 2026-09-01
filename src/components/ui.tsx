import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="page-header">
      <div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p>{description}</p>}</div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function LoadingState({ label = "Cargando información…" }: { label?: string }) {
  return <div className="state-panel" role="status"><LoaderCircle className="spin" aria-hidden="true" /><p>{label}</p></div>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="state-panel"><h3>{title}</h3><p>{description}</p>{action}</div>;
}
