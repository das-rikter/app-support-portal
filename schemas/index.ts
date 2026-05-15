import { z } from "zod";

// --- Shared primitives ---

export const IdSchema = z.uuid();

export const DateRangeSchema = z.object({
  from: z.iso.datetime(),
  to: z.iso.datetime(),
});

// --- Bug Report ---

export const BugReportSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required"),
  severity: z.enum(["low", "medium", "high", "critical"]),
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
  weekOf: z.iso.datetime(),
  reportedBy: z.email(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
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
  id: z.uuid(),
  title: z.string().min(1, "Title is required").max(200),
  summary: z.string().optional(),
  severity: z.enum(["P1", "P2", "P3", "P4"]),
  status: z.enum(["open", "investigating", "mitigated", "resolved"]),
  startedAt: z.iso.datetime(),
  resolvedAt: z.iso.datetime().nullable(),
  assignee: z.email().optional(),
  createdAt: z.iso.datetime(),
});

export type Incident = z.infer<typeof IncidentSchema>;

export const CreateIncidentFormSchema = IncidentSchema.pick({
  title: true,
  summary: true,
  severity: true,
}).extend({
  assignee: z.email("Invalid email").optional().or(z.literal("")),
});

export type CreateIncidentForm = z.infer<typeof CreateIncidentFormSchema>;

// --- Jira ---

const JiraUserSchema = z.object({
  displayName: z.string(),
  emailAddress: z.string().optional(),
}).nullish();

const JiraLinkedIssueSchema = z.object({
  id: z.string(),
  key: z.string(),
  fields: z.object({
    summary: z.string(),
    status: z.object({ name: z.string() }),
    priority: z.object({ name: z.string() }).nullish(),
    issuetype: z.object({ name: z.string() }),
  }),
}).optional();

const JiraIssueLinkSchema = z.object({
  id: z.string(),
  type: z.object({
    name: z.string(),
    inward: z.string(),
    outward: z.string(),
  }),
  inwardIssue: JiraLinkedIssueSchema,
  outwardIssue: JiraLinkedIssueSchema,
});

export const JiraIssueSchema = z.object({
  id: z.string(),
  key: z.string(),
  fields: z.object({
    summary: z.string(),
    status: z.object({ name: z.string() }),
    priority: z.object({ name: z.string() }).nullish(),
    assignee: JiraUserSchema,
    reporter: JiraUserSchema,
    created: z.string(),
    updated: z.string(),
    issuetype: z.object({ name: z.string() }),
    project: z.object({
      key: z.string(),
      name: z.string(),
    }),
    issuelinks: JiraIssueLinkSchema.array().optional(),
    customfield_10022: z.array(z.object({
      id: z.number(),
      name: z.string(),
      state: z.string(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })).nullish(),
  }).transform(({ customfield_10022, ...rest }) => ({
    ...rest,
    sprint: customfield_10022,
  })),
});

export type JiraIssue = z.infer<typeof JiraIssueSchema>;

export const JiraSearchResultSchema = z.object({
  issues: JiraIssueSchema.array(),
  nextPageToken: z.string().optional(),
  isLast: z.boolean().optional(),
});

export type JiraSearchResult = z.infer<typeof JiraSearchResultSchema>;

// --- DB-backed Incident (PostgreSQL) ---

export const DbIncidentSchema = z.object({
  id: z.number(),
  product: z.string(),
  function: z.string(),
  owner: z.string(),
  lead: z.string(),
  severity: z.enum(["P1", "P2", "P3", "P4"]),
  title: z.string(),
  date: z.string(),
  startTime: z.string(),
  closeDate: z.string(),
  closeTime: z.string(),
  outage: z.number().int(),
  resolutionDate: z.string(),
  resolutionTime: z.string(),
  downtime: z.number().int(),
  alerted: z.union([z.literal(0), z.literal(1)]),
  alertSrc: z.string(),
  cause: z.string(),
  dasCaused: z.union([z.literal(0), z.literal(1)]),
});

export type DbIncident = z.infer<typeof DbIncidentSchema>;

export const IncidentFormSchema = z.object({
  product: z.string().min(1, "Product is required"),
  function: z.string().default(""),
  owner: z.string().default(""),
  lead: z.string().default(""),
  severity: z.enum(["P1", "P2", "P3", "P4"]),
  title: z.string().min(1, "Title is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().default(""),
  closeDate: z.string().default(""),
  closeTime: z.string().default(""),
  outage: z.string().default(""),
  resolutionDate: z.string().default(""),
  resolutionTime: z.string().default(""),
  downtime: z.string().default(""),
  alerted: z.boolean().default(false),
  alertSrc: z.string().default(""),
  cause: z.string().default(""),
  dasCaused: z.boolean().default(false),
});

export type IncidentForm = z.infer<typeof IncidentFormSchema>;

// --- User ---

export const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(["Admin", "Viewer"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AppUser = z.infer<typeof UserSchema>;

// --- Jira ---

export const JiraProjectSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  lead: z.object({
    accountId: z.string(),
    displayName: z.string(),
    active: z.boolean(),
  }).optional(),
});

export type JiraProject = z.infer<typeof JiraProjectSchema>;
