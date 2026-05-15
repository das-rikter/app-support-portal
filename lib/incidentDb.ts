import type { IncidentRow } from "@/db/schema";
import type { Incident } from "@/types/incident";
import type { IncidentForm } from "@/schemas";
import { formatMinutes } from "@/lib/incidentUtils";

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
    outage: row.outage,
    resolutionDate: row.resolutionDate,
    resolutionTime: row.resolutionTime,
    downtime: row.downtime,
    alerted: row.alerted ? 1 : 0,
    alertSrc: row.alertSrc,
    cause: row.cause,
    dasCaused: row.dasCaused ? 1 : 0,
  };
}

export function incidentToFormValues(inc: Incident): Omit<IncidentForm, never> {
  return {
    product: inc.product,
    function: inc.function,
    owner: inc.owner,
    lead: inc.lead,
    severity: inc.severity,
    title: inc.title,
    date: inc.date,
    startTime: inc.startTime,
    closeDate: inc.closeDate,
    closeTime: inc.closeTime,
    outage: formatMinutes(inc.outage),
    resolutionDate: inc.resolutionDate,
    resolutionTime: inc.resolutionTime,
    downtime: formatMinutes(inc.downtime),
    alerted: inc.alerted === 1,
    alertSrc: inc.alertSrc,
    cause: inc.cause,
    dasCaused: inc.dasCaused === 1,
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
    outage: parseDurationMinutes(form.outage),
    resolutionDate: form.resolutionDate,
    resolutionTime: form.resolutionTime,
    downtime: parseDurationMinutes(form.downtime),
    alerted: form.alerted,
    alertSrc: form.alertSrc,
    cause: form.cause,
    dasCaused: form.dasCaused,
  };
}
