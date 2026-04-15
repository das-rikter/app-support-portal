interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  sub: string;
  accent: 'primary' | 'success' | 'warning' | 'error' | 'critical' | 'purple';
}

export function KpiCard({ label, value, sub, accent }: KpiCardProps) {
  return (
    <div className="kpi-card" data-accent={accent}>
      <div className="text-xs font-bold uppercase tracking-[0.06em] text-[var(--br-text-muted)] mb-2">
        {label}
      </div>
      <div className="font-sans text-[clamp(1.75rem,2.8vw,2.5rem)] font-extrabold leading-none text-[var(--br-text)] tabular-nums mb-1">
        {value}
      </div>
      <div className="text-xs pt-3 text-[var(--br-text-faint)]">{sub}</div>
    </div>
  );
}
