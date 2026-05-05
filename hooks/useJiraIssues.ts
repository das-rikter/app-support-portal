import { useQuery } from "@tanstack/react-query";
import { JiraProjectSchema, JiraSearchResultSchema } from "@/schemas";
import type { JiraIssue, JiraProject } from "@/schemas";
import type { JiraWeeklyParams, JiraHistoricalParams } from "@/lib/jiraClient";
import { z } from "zod";

export type JiraIssueEnriched = JiraIssue & {
  fields: JiraIssue["fields"] & {
    project: JiraIssue["fields"]["project"] & {
      lead: string | undefined;
    };
  };
};

export const jiraKeys = {
  all: ["jira"] as const,
  weekly: (filters: JiraWeeklyParams) => [...jiraKeys.all, "weekly", filters] as const,
  historical: (filters: JiraHistoricalParams) => [...jiraKeys.all, "historical", filters] as const,
  projects: () => [...jiraKeys.all, "projects"] as const,
};

async function fetchAllPages(
  baseUrl: string,
  baseParams: Record<string, string>
): Promise<JiraIssue[]> {
  const issues: JiraIssue[] = [];
  let nextPageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      ...baseParams,
      ...(nextPageToken ? { nextPageToken } : {}),
    });

    const response = await fetch(`${baseUrl}?${params}`);
    if (!response.ok) {
      const body: { error?: string } = await response.json().catch(() => ({}));
      throw new Error(body?.error ?? `HTTP ${response.status}`);
    }

    const page = JiraSearchResultSchema.parse(await response.json());
    issues.push(...page.issues);
    nextPageToken = page.isLast ? undefined : page.nextPageToken;
  } while (nextPageToken);

  return issues;
}

async function fetchProjectLeads(): Promise<Map<string, string | undefined>> {
  const response = await fetch("/api/jira/projects");
  if (!response.ok) {
    const body: { error?: string } = await response.json().catch(() => ({}));
    throw new Error(body?.error ?? `HTTP ${response.status}`);
  }
  const projects = await response.json() as JiraProject[];
  return new Map(projects.map((p) => [p.key, p.lead?.displayName]));
}

function enrichWithLeads(issues: JiraIssue[], leads: Map<string, string | undefined>): JiraIssueEnriched[] {
  return issues.map((issue) => ({
    ...issue,
    fields: {
      ...issue.fields,
      project: {
        ...issue.fields.project,
        lead: leads.get(issue.fields.project.key),
      },
    },
  }));
}

export function useJiraWeeklyIssues(filters: JiraWeeklyParams) {
  return useQuery({
    queryKey: jiraKeys.weekly(filters),
    queryFn: async (): Promise<JiraIssueEnriched[]> => {
      const [issues, leads] = await Promise.all([
        fetchAllPages("/api/jira/weekly", {
          updatedAfter: filters.updatedAfter,
          updatedBefore: filters.updatedBefore,
          statuses: filters.statuses.join(","),
          ...(filters.maxResults !== undefined ? { maxResults: String(filters.maxResults) } : {}),
        }),
        fetchProjectLeads(),
      ]);
      return enrichWithLeads(issues, leads);
    },
    enabled:
      !!filters.updatedAfter &&
      !!filters.updatedBefore &&
      filters.statuses.length > 0,
  });
}

export function useJiraHistoricalIssues(filters: JiraHistoricalParams) {
  return useQuery({
    queryKey: jiraKeys.historical(filters),
    queryFn: async (): Promise<JiraIssueEnriched[]> => {
      const [issues, leads] = await Promise.all([
        fetchAllPages("/api/jira/historical", {
          statuses: filters.statuses.join(","),
          ...(filters.maxResults !== undefined ? { maxResults: String(filters.maxResults) } : {}),
        }),
        fetchProjectLeads(),
      ]);
      return enrichWithLeads(issues, leads);
    },
    enabled: filters.statuses.length > 0,
  });
}

export function useJiraProjects() {
  return useQuery({
    queryKey: jiraKeys.projects(),
    queryFn: async (): Promise<JiraProject[]> => {
      const response = await fetch("/api/jira/projects");
      if (!response.ok) {
        const body: { error?: string } = await response.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${response.status}`);
      }
      return z.array(JiraProjectSchema).parse(await response.json());
    },
  });
}
