import type { JiraHistoricalParams, JiraWeeklyParams } from "@/lib/jiraClient";
import type { JiraIssue, JiraProject, JiraSearchResult } from "@/schemas";
import { JiraProjectSchema } from "@/schemas";
import { Bug } from "@/types/bug-report";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { z } from "zod";

export const jiraKeys = {
  all: ["jira"] as const,
  weekly: (filters: JiraWeeklyParams) => [...jiraKeys.all, "weekly", filters] as const,
  historical: (filters: JiraHistoricalParams) => [...jiraKeys.all, "historical", filters] as const,
  projects: () => [...jiraKeys.all, "projects"] as const,
};

const fetchAllPages = async (
  baseUrl: string,
  baseParams: Record<string, string>
): Promise<JiraIssue[]> => {
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

    const page = await response.json() as JiraSearchResult;
    issues.push(...page.issues);
    nextPageToken = page.isLast ? undefined : page.nextPageToken;
  } while (nextPageToken);

  return issues;
};

const mapToBug = (issues: JiraIssue[], leads: Map<string, string | undefined>): Bug[] =>
  issues.map((issue) => ({
    created: issue.fields.created,
    key: issue.key,
    lead: leads.get(issue.fields.project.key) ?? "Unknown",
    priority: issue.fields.priority?.name ?? "Unknown",
    project: issue.fields.project.name,
    status: issue.fields.status.name,
    summary: issue.fields.summary,
    updated: issue.fields.updated,
    linked: issue.fields.issuelinks
      ?.map((link) => link.inwardIssue?.key ?? link.outwardIssue?.key)
      .filter((k): k is string => !!k)
      .join(", ") ?? "",
    sprints: issue.fields.sprint
      ?.map((s) => s.name)
      .join(", ") ?? "",
  }));

const useJiraProjects = () =>
  useQuery({
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

const useJiraWeeklyIssues = (filters: JiraWeeklyParams) => {
  const { data: projects = [] } = useJiraProjects();
  const leads = useMemo(
    () => new Map(projects.map((p) => [p.key, p.lead?.displayName])),
    [projects]
  );

  return useQuery({
    queryKey: [...jiraKeys.weekly(filters), leads.size] as const,
    queryFn: async (): Promise<Bug[]> => {
      const issues = await fetchAllPages("/api/jira/weekly", {
        updatedAfter: filters.updatedAfter,
        updatedBefore: filters.updatedBefore,
        statuses: filters.statuses.join(","),
        ...(filters.maxResults !== undefined ? { maxResults: String(filters.maxResults) } : {}),
      });
      return mapToBug(issues, leads);
    },
    enabled:
      !!filters.updatedAfter &&
      !!filters.updatedBefore &&
      filters.statuses.length > 0,
  });
};

const useJiraHistoricalIssues = (filters: JiraHistoricalParams) => {
  const { data: projects = [] } = useJiraProjects();
  const leads = useMemo(
    () => new Map(projects.map((p) => [p.key, p.lead?.displayName])),
    [projects]
  );

  return useQuery({
    queryKey: [...jiraKeys.historical(filters), leads.size] as const,
    queryFn: async (): Promise<Bug[]> => {
      const issues = await fetchAllPages("/api/jira/historical", {
        statuses: filters.statuses.join(","),
        ...(filters.maxResults !== undefined ? { maxResults: String(filters.maxResults) } : {}),
      });
      return mapToBug(issues, leads);
    },
    enabled: filters.statuses.length > 0,
  });
};

export { useJiraHistoricalIssues, useJiraProjects, useJiraWeeklyIssues };
