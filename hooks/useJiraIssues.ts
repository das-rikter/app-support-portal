import { useQuery } from "@tanstack/react-query";
import { JiraSearchResultSchema } from "@/schemas";
import type { JiraIssue } from "@/schemas";
import type { JiraWeeklyParams, JiraHistoricalParams } from "@/lib/jiraClient";

export const jiraKeys = {
  all: ["jira"] as const,
  weekly: (filters: JiraWeeklyParams) => [...jiraKeys.all, "weekly", filters] as const,
  historical: (filters: JiraHistoricalParams) => [...jiraKeys.all, "historical", filters] as const,
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

export function useJiraWeeklyIssues(filters: JiraWeeklyParams) {
  return useQuery({
    queryKey: jiraKeys.weekly(filters),
    queryFn: async (): Promise<JiraIssue[]> => {
      return fetchAllPages("/api/jira/weekly", {
        updatedAfter: filters.updatedAfter,
        updatedBefore: filters.updatedBefore,
        statuses: filters.statuses.join(","),
        ...(filters.maxResults !== undefined ? { maxResults: String(filters.maxResults) } : {}),
      });
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
    queryFn: async (): Promise<JiraIssue[]> => {
      return fetchAllPages("/api/jira/historical", {
        statuses: filters.statuses.join(","),
        ...(filters.maxResults !== undefined ? { maxResults: String(filters.maxResults) } : {}),
      });
    },
    enabled: filters.statuses.length > 0,
  });
}
