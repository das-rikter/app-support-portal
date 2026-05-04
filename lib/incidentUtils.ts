import type { Incident } from '@/types/incident';

export function isMultiApp(product: string): boolean {
  return product.includes('&') || product.includes(',');
}

export function parseOutageHrs(s: string): number {
  if (!s) return 0;
  const cleaned = s.replace(/\s/g, '').toLowerCase();
  const p = cleaned.split(':');
  if (p.length >= 2) {
    // HH:MM format
    const hours = parseInt(p[0]) || 0;
    const minutes = parseInt(p[1]) || 0;
    return hours + minutes / 60;
  } else if (p.length === 1) {
    // Single value
    const num = parseFloat(cleaned);
    if (!isNaN(num)) {
      if (num > 24) {
        // Likely minutes
        return num / 60;
      } else {
        // Likely hours
        return num;
      }
    }
  }
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

export function extractYear(dateStr: string): string {
  const m = (dateStr || '').match(/\b(20\d{2})\b/);
  return m ? m[1] : '';
}

export function getYears(data: Incident[]): string[] {
  return [...new Set(data.map((d) => extractYear(d.date ?? '')).filter(Boolean))].sort();
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
    font: { family: 'inherit', color: 'var(--id-text)', size: 12 },
    margin: { l: 20, r: 20, t: 10, b: 40, ...extraMargin },
    xaxis: {
      gridcolor: 'var(--id-border)',
      tickfont: { color: 'var(--id-text)' },
      zeroline: false,
    },
    yaxis: {
      gridcolor: 'var(--id-border)',
      tickfont: { color: 'var(--id-text)' },
      zeroline: false,
    },
    showlegend: false,
  };
}

export const PLOTLY_CONFIG = { displayModeBar: false, responsive: true };
