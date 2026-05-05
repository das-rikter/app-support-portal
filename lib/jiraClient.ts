import type { JiraProject, JiraSearchResult } from "@/schemas";
import { JiraProjectSchema, JiraSearchResultSchema } from "@/schemas";

const JIRA_PROJECTS = [
  "NRL", "NSL", "NRP", "NB", "NLV",
  "NML", "NCA", "NCL", "CDXP", "DDE", "ETS",
] as const;

const JIRA_FIELDS = [
  "summary", "status", "priority", "assignee",
  "reporter", "created", "updated", "issuetype", "project",
  "issuelinks", "customfield_10022" // <-- This is the custom sprint field; do not remove or change
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

const buildWeeklyJql = (params: JiraWeeklyParams): string => {
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

const buildHistoricalJql = (params: JiraHistoricalParams): string => {
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

const searchJiraIssues = async (params: JiraBaseParams, jql: string): Promise<JiraSearchResult> => {
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

export const searchWeeklyJiraIssues = async (params: JiraWeeklyParams): Promise<JiraSearchResult> => searchJiraIssues(params, buildWeeklyJql(params));

export const searchHistoricalJiraIssues = async (params: JiraHistoricalParams): Promise<JiraSearchResult> => searchJiraIssues(params, buildHistoricalJql(params));

export const fetchJiraProjects = async (): Promise<JiraProject[]> => {
  const baseUrl = process.env.JIRA_BASE_URL;
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;

  if (!baseUrl || !email || !apiToken) {
    throw new Error(
      "Missing Jira credentials: JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN must be set."
    );
  }

  const credentials = Buffer.from(`${email}:${apiToken}`).toString("base64");
  const headers = { Authorization: `Basic ${credentials}`, Accept: "application/json" };

  const results = await Promise.all(
    JIRA_PROJECTS.map(async (key) => {
      const response = await fetch(`${baseUrl}/rest/api/3/project/${key}`, { headers });
      if (!response.ok) throw new Error(`Failed to fetch project ${key}: ${response.status}`);
      return JiraProjectSchema.parse(await response.json());
    })
  );

  return results;
}
