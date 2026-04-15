export interface Bug {
  key: string;
  project: string;
  lead: string;
  summary: string;
  priority: string;
  created: string;
  status: string;
  updated: string;
  sprints?: string;
  linked?: string;
}

export interface WeeklyRange {
  start: string;
  end: string;
}

export type UploadPhase = 'idle' | 'reading' | 'verifying' | 'staged' | 'error';

export interface StagedData {
  mainRows: Bug[] | null;
  weeklyRows: Bug[] | null;
  weeklyRange: WeeklyRange | null;
}

export interface ToastState {
  message: string;
  type: 'success' | 'error';
}

export interface BugUploadState {
  mainPhase: UploadPhase;
  weeklyPhase: UploadPhase;
  staged: StagedData;
  publishReady: boolean;
  toast: ToastState | null;
  publishModalOpen: boolean;
}

export interface BugMetrics {
  total: number;
  active: number;
  backlog: number;
  avgAge: number;
  maxAge: number;
  highPrio: number;
  blocked: number;
  projCount: number;
}
