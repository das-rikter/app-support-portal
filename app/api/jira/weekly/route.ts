import { searchWeeklyJiraIssues } from "@/lib/jiraClient";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const updatedAfter = searchParams.get("updatedAfter");
  const updatedBefore = searchParams.get("updatedBefore");
  const statusesParam = searchParams.get("statuses");

  if (!updatedAfter || !updatedBefore || !statusesParam) {
    return NextResponse.json(
      { error: "updatedAfter, updatedBefore, and statuses are required" },
      { status: 400 }
    );
  }

  const statuses = statusesParam.split(",").map((s) => s.trim()).filter(Boolean);
  if (!statuses.length) {
    return NextResponse.json({ error: "statuses must not be empty" }, { status: 400 });
  }

  const maxResults = searchParams.get("maxResults");
  const nextPageToken = searchParams.get("nextPageToken");

  try {
    const result = await searchWeeklyJiraIssues({
      updatedAfter,
      updatedBefore,
      statuses,
      ...(maxResults ? { maxResults: Number(maxResults) } : {}),
      ...(nextPageToken ? { nextPageToken } : {}),
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
