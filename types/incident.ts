export interface Incident {
  id?: number;
  product: string;
  fn: string;
  owner: string;
  lead: string;
  sev: 'P1' | 'P2' | 'P3' | 'P4';
  title: string;
  month: string;
  date: string;            // Outage Start Date
  startTime: string;       // Outage Start Time (MST)
  closureDate: string;     // Outage Closure Date
  closureTime: string;     // Outage Closure Time (MST)
  incidentLength: string;  // Length of Outage (HH:MM) — start to closure incl. monitoring
  resolutionDate: string;  // Issue Resolution Date
  resolutionTime: string;  // Issue Resolution Time (MST)
  downtime: string;        // Length of Downtime (HH:MM) — start to service restoration
  alerted: 0 | 1;
  alertSrc: string;
  cause: string;
  reoccurring: 0 | 1;
  dasCaused: 0 | 1;
  postmortem?: 'Yes' | 'No' | 'N/A';
}

export type IncidentView = 'overview' | 'products' | 'process' | 'incidents';
