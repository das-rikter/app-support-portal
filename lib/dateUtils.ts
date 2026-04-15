export function parseBugDate(str: string): Date {
  if (!str) return new Date(0);
  const parts = str.split(' ');
  const datePart = parts[0] || '';
  const timePart = parts[1] || '0:00';
  const [m, d, y] = datePart.split('/');
  const [h, min] = timePart.split(':');
  if (!m || !d || !y) return new Date(0);
  return new Date(+y, +m - 1, +d, +(h || 0), +(min || 0));
}

export function fmtDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

export function fmtShort(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function fmtDateStr(str: string): string {
  return str.split(' ')[0];
}

export function getPriorWeekWindow(): { start: Date; end: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dow = today.getDay();
  const currentSun = new Date(today);
  currentSun.setDate(today.getDate() - dow);
  const priorSun = new Date(currentSun);
  priorSun.setDate(currentSun.getDate() - 7);
  const priorSat = new Date(currentSun);
  priorSat.setDate(currentSun.getDate() - 1);
  priorSat.setHours(23, 59, 59, 999);
  return { start: priorSun, end: priorSat };
}
