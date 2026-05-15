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
  outage: number;          // computed: closeDateTime - startDateTime in minutes
  resolutionDate: string;  // YYYY-MM-DD
  resolutionTime: string;  // HH:MM:SS
  downtime: number;        // total minutes, start to service restoration
  alerted: boolean;
  alertSrc: string;
  cause: string;
  dasCaused: boolean;
}

export type IncidentView = 'overview' | 'products' | 'process' | 'incidents';
