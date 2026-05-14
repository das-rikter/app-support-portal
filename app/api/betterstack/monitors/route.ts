import { auth } from "@/lib/auth";
import logger from "@/lib/logger";
import { NextResponse } from "next/server";

const log = logger.child({ route: "betterstack/monitors" });

interface BetterStackMonitor {
  id: string;
  attributes: {
    url: string;
    pronounceable_name: string;
    status: string;
    last_checked_at: string | null;
    availability: string;
    check_frequency: number;
  };
}

interface BetterStackResponse {
  data: BetterStackMonitor[];
  pagination?: { next?: string | null };
}

const MAX_PAGES = 20;

async function fetchAllMonitors(apiKey: string): Promise<BetterStackMonitor[]> {
  const all: BetterStackMonitor[] = [];
  let url: string | null = "https://uptime.betterstack.com/api/v2/monitors?per_page=250";
  let pages = 0;

  while (url && pages < MAX_PAGES) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      throw new Error(`Better Stack API error ${res.status}: ${res.statusText}`);
    }
    const body: BetterStackResponse = await res.json();
    all.push(...body.data);
    pages++;
    url = body.pagination?.next ?? null;
  }

  return all;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    log.warn("GET /api/betterstack/monitors — unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.BETTERSTACK_API_KEY;
  if (!apiKey) {
    log.error("GET /api/betterstack/monitors — BETTERSTACK_API_KEY not set");
    return NextResponse.json({ error: "BETTERSTACK_API_KEY is not configured" }, { status: 500 });
  }

  log.debug({ user: session.user.email }, "GET /api/betterstack/monitors");
  try {
    const monitors = await fetchAllMonitors(apiKey);
    log.debug({ monitors: monitors.length }, "GET /api/betterstack/monitors - fetched");
    return NextResponse.json(monitors.map((m) => ({
      id: m.id,
      name: m.attributes.pronounceable_name,
      url: m.attributes.url,
      status: m.attributes.status,
      lastCheckedAt: m.attributes.last_checked_at,
      availability: m.attributes.availability,
    })));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    log.error({ err }, "GET /api/betterstack/monitors — upstream error");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
