import type { IncidentRow } from "@/db/schema";
import type { Incident } from "@/types/incident";
import type { IncidentForm } from "@/schemas";
import { formatMinutes } from "@/lib/incidentUtils";

function parseTimeComponents(timeStr: string): { h: number; min: number; sec: number } | null {
  if (!timeStr.trim()) return null;
  const match = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const min = parseInt(match[2], 10);
  const sec = match[3] ? parseInt(match[3], 10) : 0;
  const period = match[4]?.toUpperCase();
  if (period === "PM" && h !== 12) h += 12;
  else if (period === "AM" && h === 12) h = 0;
  return { h, min, sec };
}

function parseDateParts(dateStr: string): { y: number; mo: number; d: number } | null {
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return { y: parts[0], mo: parts[1], d: parts[2] };
}

function pad2(n: number) { return String(n).padStart(2, "0"); }

function utcDateTimeToLocal(dateStr: string, timeStr: string): { date: string; time: string } | null {
  if (!dateStr || !timeStr) return null;
  const t = parseTimeComponents(timeStr);
  const dp = parseDateParts(dateStr);
  if (!t || !dp) return null;
  const utc = new Date(Date.UTC(dp.y, dp.mo - 1, dp.d, t.h, t.min, t.sec));
  if (isNaN(utc.getTime())) return null;
  return {
    date: `${utc.getFullYear()}-${pad2(utc.getMonth() + 1)}-${pad2(utc.getDate())}`,
    time: `${pad2(utc.getHours())}:${pad2(utc.getMinutes())}:${pad2(utc.getSeconds())}`,
  };
}

export function localDateTimeToUTC(dateStr: string, timeStr: string): { date: string; time: string } | null {
  if (!dateStr || !timeStr) return null;
  const t = parseTimeComponents(timeStr);
  const dp = parseDateParts(dateStr);
  if (!t || !dp) return null;
  const local = new Date(dp.y, dp.mo - 1, dp.d, t.h, t.min, t.sec);
  if (isNaN(local.getTime())) return null;
  return {
    date: `${local.getUTCFullYear()}-${pad2(local.getUTCMonth() + 1)}-${pad2(local.getUTCDate())}`,
    time: `${pad2(local.getUTCHours())}:${pad2(local.getUTCMinutes())}:${pad2(local.getUTCSeconds())}`,
  };
}

function computeOutageMinutes(row: IncidentRow): number {
  if (!row.date || !row.startTime || !row.closeDate || !row.closeTime) return 0;
  const start = new Date(`${row.date}T${row.startTime}Z`);
  const close = new Date(`${row.closeDate}T${row.closeTime}Z`);
  if (isNaN(start.getTime()) || isNaN(close.getTime())) return 0;
  const diff = close.getTime() - start.getTime();
  return diff > 0 ? Math.floor(diff / 60000) : 0;
}

function parseDurationMinutes(s: string): number {
  if (!s) return 0;
  const parts = s.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

export function rowToIncident(row: IncidentRow): Incident {
  return {
    id: row.id,
    product: row.product,
    function: row.function,
    owner: row.owner,
    lead: row.lead,
    severity: row.severity as Incident["severity"],
    title: row.title,
    date: row.date,
    startTime: row.startTime,
    closeDate: row.closeDate,
    closeTime: row.closeTime,
    outage: computeOutageMinutes(row),
    resolutionDate: row.resolutionDate,
    resolutionTime: row.resolutionTime,
    downtime: row.downtime,
    alerted: row.alerted,
    alertSrc: row.alertSrc,
    cause: row.cause,
    dasCaused: row.dasCaused,
  };
}

export function incidentToFormValues(inc: Incident): Omit<IncidentForm, never> {
  const start = utcDateTimeToLocal(inc.date, inc.startTime);
  const close = utcDateTimeToLocal(inc.closeDate, inc.closeTime);
  const resolution = utcDateTimeToLocal(inc.resolutionDate, inc.resolutionTime);
  return {
    product: inc.product,
    function: inc.function,
    owner: inc.owner,
    lead: inc.lead,
    severity: inc.severity,
    title: inc.title,
    date: start?.date ?? inc.date,
    startTime: start?.time ?? inc.startTime,
    closeDate: close?.date ?? inc.closeDate,
    closeTime: close?.time ?? inc.closeTime,
    resolutionDate: resolution?.date ?? inc.resolutionDate,
    resolutionTime: resolution?.time ?? inc.resolutionTime,
    downtime: formatMinutes(inc.downtime),
    alerted: inc.alerted,
    alertSrc: inc.alertSrc,
    cause: inc.cause,
    dasCaused: inc.dasCaused,
  };
}

export function formToInsert(form: IncidentForm): Omit<IncidentRow, "id" | "createdAt" | "updatedAt"> {
  return {
    product: form.product,
    function: form.function,
    owner: form.owner,
    lead: form.lead,
    severity: form.severity,
    title: form.title,
    date: form.date,
    startTime: form.startTime,
    closeDate: form.closeDate,
    closeTime: form.closeTime,
    resolutionDate: form.resolutionDate,
    resolutionTime: form.resolutionTime,
    downtime: parseDurationMinutes(form.downtime),
    alerted: form.alerted,
    alertSrc: form.alertSrc,
    cause: form.cause,
    dasCaused: form.dasCaused,
  };
}
