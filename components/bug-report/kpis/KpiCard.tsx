const ACCENT_BAR: Record<string, string> = {
  primary:  'bg-primary-clementine-900',
  success:  'bg-[#16a34a]',
  warning:  'bg-[#d97706]',
  error:    'bg-[#dc2626]',
  critical: 'bg-[#dc2626]',
  purple:   'bg-[#7c3aed]',
};

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  sub: string;
  accent: 'primary' | 'success' | 'warning' | 'error' | 'critical' | 'purple';
}

export function KpiCard({ label, value, sub, accent }: KpiCardProps) {
  return (
    <div className="relative overflow-hidden bg-card rounded-2xl border border-border p-5 shadow-xs">
      <div className={`absolute top-0 left-0 right-0 h-0.75 rounded-t-2xl ${ACCENT_BAR[accent]}`} />
      <div className="text-[0.68rem] font-bold uppercase tracking-[0.06em] text-muted-foreground mb-2">
        {label}
      </div>
      <div className="font-sans text-[clamp(1.75rem,2.8vw,2.5rem)] font-extrabold leading-none text-foreground tabular-nums mb-1">
        {value}
      </div>
      <div className="text-xs pt-3 text-muted-foreground/70">{sub}</div>
    </div>
  );
}
