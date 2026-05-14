import { auth } from "@/lib/auth";
import logger from "@/lib/logger";
import { searchWeeklyJiraIssues } from "@/lib/jiraClient";
import { NextRequest, NextResponse } from "next/server";

const log = logger.child({ route: "jira/weekly" });

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    log.warn("GET /api/jira/weekly — unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;

  const updatedAfter = searchParams.get("updatedAfter");
  const updatedBefore = searchParams.get("updatedBefore");
  const statusesParam = searchParams.get("statuses");

  if (!updatedAfter || !updatedBefore || !statusesParam) {
    log.warn("GET /api/jira/weekly — missing required params");
    return NextResponse.json(
      { error: "updatedAfter, updatedBefore, and statuses are required" },
      { status: 400 }
    );
  }

  const statuses = statusesParam.split(",").map((s) => s.trim()).filter(Boolean);
  if (!statuses.length) {
    log.warn("GET /api/jira/weekly — statuses is empty");
    return NextResponse.json({ error: "statuses must not be empty" }, { status: 400 });
  }

  const maxResults = searchParams.get("maxResults");
  const nextPageToken = searchParams.get("nextPageToken");

  log.debug({ updatedAfter, updatedBefore, statusCount: statuses.length }, "GET /api/jira/weekly");
  try {
    const result = await searchWeeklyJiraIssues({
      updatedAfter,
      updatedBefore,
      statuses,
      ...(maxResults ? { maxResults: Number(maxResults) } : {}),
      ...(nextPageToken ? { nextPageToken } : {}),
    });
    log.debug({ returned: result.issues?.length }, "GET /api/jira/weekly — done");
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    log.error({ err: error }, "GET /api/jira/weekly — error");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
