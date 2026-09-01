import { STATUS_META } from "@/lib/constants";

export function StatusBadge({ status }: { status: keyof typeof STATUS_META }) {
  const meta = STATUS_META[status];
  return <span className={`status-badge ${meta.className}`}><span aria-hidden="true">{meta.symbol}</span>{meta.label}</span>;
}
