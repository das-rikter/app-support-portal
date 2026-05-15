export interface Incident {
  id?: number;
  product: string;
  function: string;
  owner: string;
  lead: string;
  severity: 'P1' | 'P2' | 'P3' | 'P4';
  title: string;
  date: string;            // YYYY-MM-DD
  startTime: string;       // HH:MM:SS
  closeDate: string;       // YYYY-MM-DD
  closeTime: string;       // HH:MM:SS
  outage: number;          // total minutes, start to closure incl. monitoring
  resolutionDate: string;  // YYYY-MM-DD
  resolutionTime: string;  // HH:MM:SS
  downtime: number;        // total minutes, start to service restoration
  alerted: 0 | 1;
  alertSrc: string;
  cause: string;
  dasCaused: 0 | 1;
}

export type IncidentView = 'overview' | 'products' | 'process' | 'incidents';
