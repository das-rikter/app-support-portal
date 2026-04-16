import type { Incident } from '@/types/incident';

export function parseOutageHrs(s: string): number {
  if (!s) return 0;
  const p = s.replace(/\s/g, '').split(':');
  if (p.length >= 2) return parseInt(p[0]) + parseInt(p[1]) / 60;
  return 0;
}

export const MONTH_ORDER: string[] = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function getProducts(data: Incident[]): string[] {
  return [...new Set(data.map((d) => d.product))].sort();
}

export function getMonths(data: Incident[]): string[] {
  return [...new Set(data.map((d) => d.month))].sort(
    (a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b)
  );
}

export const CHART_COLORS = {
  o:  '#d66a06',
  o2: '#f1a24b',
  o3: '#f5c78a',
  b:  '#3b82f6',
  b2: '#60a5fa',
  b3: '#93c5fd',
  g:  '#16a34a',
  r:  '#dc2626',
  y:  '#d97706',
  p:  '#8b5cf6',
} as const;

export function chartBase(extraMargin: Record<string, number> = {}): object {
  return {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { family: 'inherit', color: '#1a1d23', size: 12 },
    margin: { l: 20, r: 20, t: 10, b: 40, ...extraMargin },
    xaxis: {
      gridcolor: 'rgba(20,24,32,.07)',
      tickfont: { color: '#6b7280' },
      zeroline: false,
    },
    yaxis: {
      gridcolor: 'rgba(20,24,32,.07)',
      tickfont: { color: '#6b7280' },
      zeroline: false,
    },
    showlegend: false,
  };
}

export const PLOTLY_CONFIG = { displayModeBar: false, responsive: true };
