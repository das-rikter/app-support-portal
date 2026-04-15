// Types derived from Zod schemas
export type { BugReport, CreateBugReportForm, Incident, CreateIncidentForm } from "@/schemas";

// Shared utility types
export interface User {
  id: string;
  name: string | null;
  email: string | null;
  image?: string | null;
}

export interface PageMeta {
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}
