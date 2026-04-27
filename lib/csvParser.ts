import type { Bug, WeeklyRange } from '@/types/bug-report';
import type { Incident } from '@/types/incident';

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

function parseCSVRaw(text: string, requiredField?: string): Record<string, string>[] {
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
        r !== null && (!requiredField || !!(r[requiredField]))
    );
}

export function parseMainCSV(text: string): Bug[] {
  const rows = parseCSVRaw(text, 'Issue key');
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
  const rows = parseCSVRaw(text, 'Issue key');
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

interface ParseError {
  row: number;
  field: string;
  value: string;
  message: string;
}

function parseBooleanFlag(value: string, row: number, field: string, errors: ParseError[]): 0 | 1 {
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return 1;
  if (normalized === '' || normalized === '0' || normalized === 'false' || normalized === 'n' || normalized === 'off') return 0;
  errors.push({ row, field, value, message: `Invalid boolean value for ${field}: '${value}'` });
  return 0;
}

function parseDasCaused(value: string, row: number, errors: ParseError[]): 0 | 1 {
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on', 'internal', 'das caused', 'dascaused'].includes(normalized)) return 1;
  if (normalized === '' || normalized === '0' || normalized === 'false' || normalized === 'n' || normalized === 'off' || normalized === 'external') return 0;
  errors.push({ row, field: 'dasCaused', value, message: `Invalid ownership value for dasCaused: '${value}'` });
  return 0;
}

function parsePostmortem(value: string, row: number, errors: ParseError[]): 'Yes' | 'No' | 'N/A' {
  const normalized = value.trim().toLowerCase();
  if (['yes', 'y', 'true', 'completed', '1'].includes(normalized)) return 'Yes';
  if (['no', 'n', 'false', '0'].includes(normalized)) return 'No';
  if (normalized === 'n/a' || normalized === 'na' || normalized === '') return 'N/A';
  errors.push({ row, field: 'postmortem', value, message: `Invalid postmortem value: '${value}'` });
  return 'N/A';
}

function parseSeverity(value: string, row: number, errors: ParseError[]): 'P1' | 'P2' | 'P3' | 'P4' {
  const normalized = value.trim().toUpperCase();
  if (['P1', 'P2', 'P3', 'P4'].includes(normalized)) return normalized as 'P1' | 'P2' | 'P3' | 'P4';
  errors.push({ row, field: 'sev', value, message: `Invalid severity: '${value}'. Expected P1, P2, P3, or P4.` });
  return 'P4';
}

function parseInteger(value: string, row: number, field: string, errors: ParseError[]): number {
  const parsed = parseInt(value.trim(), 10);
  if (!Number.isFinite(parsed)) {
    if (value.trim() !== '') {
      errors.push({ row, field, value, message: `Invalid integer for ${field}: '${value}'` });
    }
    return 0;
  }
  return parsed;
}

function requireField(value: string, row: number, field: string, errors: ParseError[]) {
  if (!value.trim()) {
    errors.push({ row, field, value, message: `Missing required field ${field}.` });
  }
}

function formatOutageFromMinutes(minutes: number): string {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
}

const MONTH_NORMALIZE: Record<string, string> = {
  january: 'Jan', february: 'Feb', march: 'Mar', april: 'Apr',
  may: 'May', june: 'Jun', july: 'Jul', august: 'Aug',
  september: 'Sep', october: 'Oct', november: 'Nov', december: 'Dec',
};

function normalizeMonth(raw: string): string {
  const key = raw.trim().toLowerCase();
  return MONTH_NORMALIZE[key] ?? raw.trim();
}

export function parseIncidentsCSV(text: string): Incident[] {
  const rows = parseCSVRaw(text);
  if (!rows.length) throw new Error('No incidents found in file.');

  const errors: ParseError[] = [];
  const incidents = rows
    .map((r, index) => {
      const row = index + 2;
      const product = (r['Product'] || '').trim();
      const fn = (r['Function'] || '').trim();
      const title = (r['Incident Title'] || '').trim();
      const month = normalizeMonth(r['Month'] || '');
      const date = (r['Outage Start Date'] || '').trim();
      const sevValue = (r['Outage Level (when outage first launched)'] || '').trim();
      const alertedValue = (r['Was Alert Triggered to Inform DAS?'] || '').trim();
      const reoccurringValue = (r['Is This A Reoccurring Issue?'] || '').trim();
      const dasCausedValue = (r['DAS Caused?'] || '').trim();
      const postmortemValue = (r['Postmortem Sent'] || '').trim();

      requireField(product, row, 'Product', errors);
      requireField(fn, row, 'Function', errors);
      requireField(title, row, 'Incident Title', errors);
      requireField(month, row, 'Month', errors);
      requireField(date, row, 'Outage Start Date', errors);

      return {
        product,
        fn,
        owner: (r['Product Owner'] || '').trim(),
        lead: (r['Tech Team Lead'] || '').trim(),
        sev: parseSeverity(sevValue, row, errors),
        title,
        month,
        date,
        startTime: (r['Outage Start Time (MST)'] || '').trim(),
        closureDate: (r['Outage Closure Date'] || '').trim(),
        closureTime: (r['Outage Closure Time (MST)'] || '').trim(),
        incidentLength: (r['Length of Outage (HH:MM)'] || '').trim(),
        resolutionDate: (r['Issue Resolution Date'] || '').trim(),
        resolutionTime: (r['Issue Resolution  Time (MST)'] || r['Issue Resolution Time (MST)'] || '').trim(),
        downtime: (r['Length of Downtime (HH:MM)'] || '').trim(),
        alerted: parseBooleanFlag(alertedValue, row, 'alerted', errors),
        alertSrc: (r['How Were We Alerted'] || '').trim(),
        cause: (r['Category Reason For Issue'] || '').trim(),
        reoccurring: parseBooleanFlag(reoccurringValue, row, 'reoccurring', errors),
        dasCaused: parseDasCaused(dasCausedValue, row, errors),
        postmortem: parsePostmortem(postmortemValue, row, errors),
      };
    })
    .filter((i) => i.title.trim());

  if (errors.length) {
    const message = errors
      .map((error) => `Row ${error.row}: ${error.message}`)
      .join('\n');
    throw new Error(`CSV validation failed:\n${message}`);
  }

  return incidents;
}
