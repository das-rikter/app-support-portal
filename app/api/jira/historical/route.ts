import { auth } from "@/lib/auth";
import logger from "@/lib/logger";
import { searchHistoricalJiraIssues } from "@/lib/jiraClient";
import { NextRequest, NextResponse } from "next/server";

const log = logger.child({ route: "jira/historical" });

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    log.warn("GET /api/jira/historical — unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;

  const statusesParam = searchParams.get("statuses");

  if (!statusesParam) {
    log.warn("GET /api/jira/historical — missing statuses param");
    return NextResponse.json(
      { error: "statuses is required" },
      { status: 400 }
    );
  }

  const statuses = statusesParam.split(",").map((s) => s.trim()).filter(Boolean);
  if (!statuses.length) {
    log.warn("GET /api/jira/historical — statuses is empty");
    return NextResponse.json({ error: "statuses must not be empty" }, { status: 400 });
  }

  const maxResults = searchParams.get("maxResults");
  const nextPageToken = searchParams.get("nextPageToken");

  log.debug({ statusCount: statuses.length }, "GET /api/jira/historical");
  try {
    const result = await searchHistoricalJiraIssues({
      statuses,
      ...(maxResults ? { maxResults: Number(maxResults) } : {}),
      ...(nextPageToken ? { nextPageToken } : {}),
    });
    log.debug({ returned: result.issues?.length }, "GET /api/jira/historical — done");
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    log.error({ err: error }, "GET /api/jira/historical — error");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
