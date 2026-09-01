interface Slice { label: string; value: number; color: string }

export function DonutChart({ slices, centerLabel }: { slices: Slice[]; centerLabel: string }) {
  const total = slices.reduce((sum, item) => sum + item.value, 0);
  let progress = 0;
  const gradient = slices.map((slice) => {
    const start = total ? (progress / total) * 100 : 0;
    progress += slice.value;
    const end = total ? (progress / total) * 100 : 0;
    return `${slice.color} ${start}% ${end}%`;
  }).join(", ");
  return (
    <div className="chart-layout">
      <div className="donut" style={{ background: total ? `conic-gradient(${gradient})` : "#e5eaf1" }} role="img" aria-label={slices.map((item) => `${item.label}: ${item.value}`).join(", ")}><span><strong>{total}</strong>{centerLabel}</span></div>
      <div className="chart-legend">{slices.map((item) => <div key={item.label}><i style={{ background: item.color }} /><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>
    </div>
  );
}

export function BarChart({ items, valueFormatter = String }: { items: { label: string; value: number; color?: string }[]; valueFormatter?: (value: number) => string }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return <div className="bar-chart" role="img" aria-label={items.map((item) => `${item.label}: ${valueFormatter(item.value)}`).join(", ")}>{items.map((item) => <div className="bar-row" key={item.label}><div className="bar-meta"><span>{item.label}</span><strong>{valueFormatter(item.value)}</strong></div><div className="bar-track"><span style={{ width: `${Math.max((item.value / max) * 100, item.value ? 3 : 0)}%`, background: item.color }} /></div></div>)}</div>;
}
