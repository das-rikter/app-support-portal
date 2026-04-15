import type { Bug, WeeklyRange } from '@/types/bug-report';

function safeSummary(s: string): string {
  return s
    .replace(/[\u2018\u2019\u02BC]/g, ' ')
    .replace(/[\u201C\u201D]/g, ' ')
    .replace(/\u00AE/g, '(R)')
    .replace(/\u00A9/g, '(C)')
    .replace(/\u2122/g, '(TM)')
    .replace(/'/g, ' ')
    .replace(/\\/g, '/');
}

function parseCSVRaw(text: string): Record<string, string>[] {
  text = text.replace(/\r\n/g, '\n').replace(/^\uFEFF/, '').trim();
  const lines = text.split('\n');
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));

  return lines
    .slice(1)
    .map((line) => {
      if (!line.trim()) return null;
      const cols: string[] = [];
      let cur = '';
      let inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          inQ = !inQ;
        } else if (ch === ',' && !inQ) {
          cols.push(cur.trim());
          cur = '';
        } else {
          cur += ch;
        }
      }
      cols.push(cur.trim());
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        let val = (cols[i] || '').replace(/^"|"$/g, '');
        if (h === 'Summary') val = safeSummary(val);
        obj[h] = val;
      });
      return obj;
    })
    .filter(
      (r): r is Record<string, string> =>
        r !== null && !!(r['Issue key'] || r['Issue Key'])
    );
}

export function parseMainCSV(text: string): Bug[] {
  const rows = parseCSVRaw(text);
  if (!rows.length) throw new Error('No bugs found in file.');

  return rows
    .map((r) => ({
      key: (r['Issue key'] || r['Issue Key'] || '').trim(),
      project: (r['Project name'] || '').trim(),
      lead: (r['Project lead'] || '').trim(),
      summary: (r['Summary'] || '').trim(),
      priority: (r['Priority'] || '').trim(),
      created: (r['Created'] || '').trim(),
      status: (r['Status'] || '').trim(),
      updated: (r['Updated'] || '').trim(),
    }))
    .filter((b) => b.key.trim());
}

export function parseWeeklyCSV(text: string): { bugs: Bug[]; range: WeeklyRange } {
  const rows = parseCSVRaw(text);
  if (!rows.length) throw new Error('No bugs found in file.');

  const bugs: Bug[] = rows
    .map((r) => ({
      key: (r['Issue key'] || r['Issue Key'] || '').trim(),
      project: (r['Project name'] || '').trim(),
      lead: (r['Project lead'] || '').trim(),
      summary: (r['Summary'] || '').trim(),
      priority: (r['Priority'] || '').trim(),
      created: (r['Created'] || '').trim(),
      status: (r['Status'] || '').trim(),
      updated: (r['Updated'] || '').trim(),
      sprints: (r['Sprints'] || r['Sprint'] || '').trim(),
      linked: (r['Linked Tickets'] || r['Linked tickets'] || '').trim(),
    }))
    .filter((b) => b.key.trim());

  // Detect date range from updated dates
  const dates = bugs
    .map((b) => new Date(b.updated || ''))
    .filter((d) => !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
  const minDate = dates[0] || new Date();
  const dow = minDate.getDay();
  const weekStart = new Date(minDate);
  weekStart.setDate(minDate.getDate() - dow);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const range: WeeklyRange = {
    start: `${weekStart.getMonth() + 1}/${weekStart.getDate()}/${weekStart.getFullYear()}`,
    end: `${weekEnd.getMonth() + 1}/${weekEnd.getDate()}/${weekEnd.getFullYear()}`,
  };

  return { bugs, range };
}
