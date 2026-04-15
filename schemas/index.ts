import { z } from "zod";

// --- Shared primitives ---

export const IdSchema = z.string().uuid();

export const DateRangeSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

// --- Bug Report ---

export const BugReportSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required"),
  severity: z.enum(["low", "medium", "high", "critical"]),
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
  weekOf: z.string().datetime(),
  reportedBy: z.string().email(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type BugReport = z.infer<typeof BugReportSchema>;

export const CreateBugReportFormSchema = BugReportSchema.pick({
  title: true,
  description: true,
  severity: true,
}).extend({
  weekOf: z.date({ error: "Week is required" }),
});

export type CreateBugReportForm = z.infer<typeof CreateBugReportFormSchema>;

// --- Incident ---

export const IncidentSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(200),
  summary: z.string().optional(),
  severity: z.enum(["P1", "P2", "P3", "P4"]),
  status: z.enum(["open", "investigating", "mitigated", "resolved"]),
  startedAt: z.string().datetime(),
  resolvedAt: z.string().datetime().nullable(),
  assignee: z.string().email().optional(),
  createdAt: z.string().datetime(),
});

export type Incident = z.infer<typeof IncidentSchema>;

export const CreateIncidentFormSchema = IncidentSchema.pick({
  title: true,
  summary: true,
  severity: true,
}).extend({
  assignee: z.string().email("Invalid email").optional().or(z.literal("")),
});

export type CreateIncidentForm = z.infer<typeof CreateIncidentFormSchema>;
