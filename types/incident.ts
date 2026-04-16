export interface Incident {
  product: string;
  fn: string;
  owner: string;
  lead: string;
  sev: 'P1' | 'P2' | 'P3' | 'P4';
  title: string;
  month: string;
  date: string;
  startTime: string;
  closeDate: string;
  outage: string;
  downtimeMins: number;
  alerted: 0 | 1;
  alertSrc: string;
  cause: string;
  reoccurring: 0 | 1;
  dasCaused: 0 | 1;
  postmortem: 'Yes' | 'No' | 'N/A';
}

export type IncidentView = 'overview' | 'products' | 'process' | 'incidents';
