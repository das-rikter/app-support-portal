import { auth } from "@/lib/auth";
import { searchHistoricalJiraIssues } from "@/lib/jiraClient";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;

  const statusesParam = searchParams.get("statuses");

  if (!statusesParam) {
    return NextResponse.json(
      { error: "statuses is required" },
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
    const result = await searchHistoricalJiraIssues({
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
