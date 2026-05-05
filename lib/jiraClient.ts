import type { JiraSearchResult } from "@/schemas";
import { JiraSearchResultSchema } from "@/schemas";

const JIRA_PROJECTS = [
  "NRL", "NSL", "NRP", "NB", "NLV",
  "NML", "NCA", "NCL", "CDXP", "DDE", "ETS",
] as const;

const JIRA_FIELDS = [
  "summary", "status", "priority", "assignee",
  "reporter", "created", "updated", "issuetype", "project",
].join(",");

interface JiraBaseParams {
  statuses: string[];
  maxResults?: number;
  nextPageToken?: string;
}

export interface JiraWeeklyParams extends JiraBaseParams {
  updatedAfter: string;
  updatedBefore: string;
}

export type JiraHistoricalParams = JiraBaseParams;

function buildWeeklyJql(params: JiraWeeklyParams): string {
  const projects = JIRA_PROJECTS.join(", ");
  const statuses = params.statuses.map((s) => `"${s}"`).join(", ");
  const jql = [
    `project IN (${projects})`,
    `type = Bug`,
    `updated >= "${params.updatedAfter}"`,
    `updated <= "${params.updatedBefore}"`,
    `status IN (${statuses})`,
  ].join(" AND ");

  return `${jql} ORDER BY created DESC`;
}

function buildHistoricalJql(params: JiraHistoricalParams): string {
  const projects = JIRA_PROJECTS.join(", ");
  const statuses = params.statuses.map((s: string) => `"${s}"`).join(", ");
  const jql = [
    `project IN (${projects})`,
    `status IN (${statuses})`,
    `type = Bug`,
    `(labels NOT IN ("wontdo", "won't-do") OR labels IS EMPTY)`,
  ].join(" AND ");

  return `${jql} ORDER BY created DESC`;
}

async function searchJiraIssues(params: JiraBaseParams, jql: string): Promise<JiraSearchResult> {
  const baseUrl = process.env.JIRA_BASE_URL;
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;

  if (!baseUrl || !email || !apiToken) {
    throw new Error(
      "Missing Jira credentials: JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN must be set."
    );
  }

  const credentials = Buffer.from(`${email}:${apiToken}`).toString("base64");

  const response = await fetch(`${baseUrl}/rest/api/3/search/jql`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jql,
      maxResults: params.maxResults ?? 100,
      ...(params.nextPageToken ? { nextPageToken: params.nextPageToken } : {}),
      fields: JIRA_FIELDS.split(","),
    }),
  });

  if (!response.ok) {
    let message = `Jira API error ${response.status}: ${response.statusText}`;
    try {
      const body = await response.json();
      if (Array.isArray(body?.errorMessages) && body.errorMessages.length) {
        message = body.errorMessages.join(", ");
      }
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }

  return JiraSearchResultSchema.parse(await response.json());
}

export async function searchWeeklyJiraIssues(params: JiraWeeklyParams): Promise<JiraSearchResult> {
  return searchJiraIssues(params, buildWeeklyJql(params));
}

export async function searchHistoricalJiraIssues(params: JiraHistoricalParams): Promise<JiraSearchResult> {
  return searchJiraIssues(params, buildHistoricalJql(params));
}
