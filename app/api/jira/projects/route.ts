import { fetchJiraProjects } from "@/lib/jiraClient";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const projects = await fetchJiraProjects();
    return NextResponse.json(projects);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
