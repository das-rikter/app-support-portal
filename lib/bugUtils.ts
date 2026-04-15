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
    case 'highest': return 'prio-highest';
    case 'high': return 'prio-high';
    case 'medium': return 'prio-medium';
    case 'low': return 'prio-low';
    case 'lowest': return 'prio-lowest';
    default: return 'prio-medium';
  }
}

export function getStatClass(s: string): string {
  const lc = s.toLowerCase();
  if (lc.includes('block')) return 'stat-blocked';
  if (lc.includes('deploy') || lc.includes('production')) return 'stat-deploy';
  if (lc.includes('grooming')) return 'stat-grooming';
  if (lc.includes('review') || lc.includes('qa')) return 'stat-review';
  if (lc.includes('progress') || lc.includes('development') || lc.includes('waiting')) return 'stat-active';
  return '';
}

export function getProjBadgeClass(key: string): string {
  const prefix = key.split('-')[0].toLowerCase();
  const map: Record<string, string> = {
    nml: 'badge-nml', nrl: 'badge-nrl', nsl: 'badge-nsl', nlv: 'badge-nlv',
    nb: 'badge-nb', nrp: 'badge-nrp', ets: 'badge-ets', cdxp: 'badge-cdxp',
    ncl: 'badge-ncl', nca: 'badge-api',
  };
  return map[prefix] || '';
}
