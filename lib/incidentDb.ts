import type { IncidentRow } from "@/db/schema";
import type { Incident } from "@/types/incident";
import type { IncidentForm } from "@/schemas";

export function rowToIncident(row: IncidentRow): Incident {
  return {
    id: row.id,
    product: row.product,
    fn: row.fn,
    owner: row.owner,
    lead: row.lead,
    sev: row.sev as Incident["sev"],
    title: row.title,
    month: row.month,
    date: row.date,
    startTime: row.startTime,
    closureDate: row.closureDate,
    closureTime: row.closureTime,
    incidentLength: row.incidentLength,
    resolutionDate: row.resolutionDate,
    resolutionTime: row.resolutionTime,
    downtime: row.downtime,
    alerted: row.alerted ? 1 : 0,
    alertSrc: row.alertSrc,
    cause: row.cause,
    reoccurring: row.reoccurring ? 1 : 0,
    dasCaused: row.dasCaused ? 1 : 0,
    postmortem: row.postmortem as Incident["postmortem"],
  };
}

export function formToInsert(form: IncidentForm): Omit<IncidentRow, "id" | "createdAt" | "updatedAt"> {
  return {
    product: form.product,
    fn: form.fn,
    owner: form.owner,
    lead: form.lead,
    sev: form.sev,
    title: form.title,
    month: form.month,
    date: form.date,
    startTime: form.startTime,
    closureDate: form.closureDate,
    closureTime: form.closureTime,
    incidentLength: form.incidentLength,
    resolutionDate: form.resolutionDate,
    resolutionTime: form.resolutionTime,
    downtime: form.downtime,
    alerted: form.alerted,
    alertSrc: form.alertSrc,
    cause: form.cause,
    reoccurring: form.reoccurring,
    dasCaused: form.dasCaused,
    postmortem: form.postmortem ?? null,
  };
}
