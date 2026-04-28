import type { Bug } from '@/types/bug-report';

export function getAge(bug: Bug): number {
  const d = new Date(bug.created);
  return isNaN(d.getTime()) ? 0 : Math.floor((Date.now() - d.getTime()) / 86400000);
}

export function getAgeDays(created: string): number {
  const parts = created.split(' ');
  const datePart = parts[0] || '';
  const [m, d, y] = datePart.split('/');
  if (!m || !d || !y) return 0;
  const dt = new Date(+y, +m - 1, +d);
  return isNaN(dt.getTime()) ? 0 : Math.floor((Date.now() - dt.getTime()) / 86400000);
}

export function getPrioClass(p: string): string {
  switch (p.toLowerCase()) {
    case 'highest': return 'bg-[#fee2e2] text-[#991b1b] dark:bg-[#450a0a] dark:text-[#fca5a5]';
    case 'high':    return 'bg-[#ffedd5] text-[#9a3412] dark:bg-[#431407] dark:text-[#fdba74]';
    case 'medium':  return 'bg-[#dbeafe] text-[#1e40af] dark:bg-[#1e3a5f] dark:text-[#93c5fd]';
    case 'low':     return 'bg-[#f0fdf4] text-[#166534] dark:bg-[#052e16] dark:text-[#86efac]';
    case 'lowest':  return 'bg-[#f1f5f9] text-[#475569] dark:bg-[#1e293b] dark:text-[#94a3b8]';
    default:        return 'bg-[#dbeafe] text-[#1e40af] dark:bg-[#1e3a5f] dark:text-[#93c5fd]';
  }
}

export function getStatClass(s: string): string {
  const lc = s.toLowerCase();
  if (lc.includes('block'))    return 'bg-[#fee2e2] text-[#dc2626] dark:bg-[#450a0a] dark:text-[#f87171]';
  if (lc.includes('deploy') || lc.includes('production')) return 'bg-[#ede9fe] text-[#7c3aed] dark:bg-[#1e1040] dark:text-[#a78bfa]';
  if (lc.includes('grooming')) return 'bg-[#ffedd5] text-[#ea580c] dark:bg-[#1f0d00] dark:text-[#fb923c]';
  if (lc.includes('review') || lc.includes('qa')) return 'bg-[#fef3c7] text-[#d97706] dark:bg-[#1c1400] dark:text-[#fbbf24]';
  if (lc.includes('progress') || lc.includes('development') || lc.includes('waiting')) return 'bg-[#dcfce7] text-[#16a34a] dark:bg-[#052e16] dark:text-[#4ade80]';
  return 'bg-muted text-muted-foreground border border-border';
}

export function getProjBadgeClass(key: string): string {
  const prefix = key.split('-')[0].toLowerCase();
  const map: Record<string, string> = {
    nml:  'bg-[#971d1d] text-white',
    nrl:  'bg-[#8a5252] text-white',
    nsl:  'bg-[#7e7188] text-white',
    nlv:  'bg-[#6da164] text-white',
    nb:   'bg-[#1b6392] text-white',
    nrp:  'bg-[#7c589e] text-white',
    ets:  'bg-[#2c972c] text-white',
    cdxp: 'bg-[#8ea3c0] text-white',
    ncl:  'bg-[#884408] text-white',
    nca:  'bg-[#755f5f] text-white',
  };
  return map[prefix] || '';
}
