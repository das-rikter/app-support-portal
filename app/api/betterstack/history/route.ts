import { auth } from "@/lib/auth";
import logger from "@/lib/logger";
import type { DayStatus } from "@/lib/monitorGroups";
import { GROUPED_MONITOR_NAMES, normalizeMonitorName } from "@/lib/monitorGroups";
import { NextResponse } from "next/server";

const log = logger.child({ route: "betterstack/history" });

const HISTORY_DAYS = 45;

interface BetterStackMonitor {
  id: string;
  attributes: {
    pronounceable_name: string;
    status: string;
  };
}

interface BetterStackIncident {
  attributes: {
    started_at: string;
    resolved_at: string | null;
    ongoing: boolean;
    status: string;
  };
}


async function fetchAllMonitors(apiKey: string, revalidate: number): Promise<BetterStackMonitor[]> {
  const all: BetterStackMonitor[] = [];
  let url: string | null = "https://uptime.betterstack.com/api/v2/monitors?per_page=250";

  while (url) {
    const res: Response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate },
    });
    if (!res.ok) break;
    const body = await res.json() as { data: BetterStackMonitor[]; pagination?: { next?: string | null } };
    all.push(...body.data);
    url = body.pagination?.next ?? null;
  }

  return all;
}

async function fetchIncidents(apiKey: string, monitorId: string, from: Date, revalidate: number): Promise<BetterStackIncident[]> {
  const all: BetterStackIncident[] = [];
  let url: string | null = `https://uptime.betterstack.com/api/v2/monitors/${monitorId}/incidents?from=${from.toISOString()}&per_page=250`;

  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate },
    });
    if (!res.ok) break;
    const body = await res.json() as { data: BetterStackIncident[]; pagination?: { next?: string | null } };
    all.push(...body.data);
    url = body.pagination?.next ?? null;
  }

  return all;
}

function computeDayStatuses(incidents: BetterStackIncident[], days: number): DayStatus[] {
  const now = new Date();
  const result: DayStatus[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const dayStart = new Date(now);
    dayStart.setUTCDate(dayStart.getUTCDate() - i);
    dayStart.setUTCHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const dayIncidents = incidents.filter((inc) => {
      const start = new Date(inc.attributes.started_at);
      const end = inc.attributes.resolved_at ? new Date(inc.attributes.resolved_at) : now;
      return start <= dayEnd && end >= dayStart;
    });

    const hasMaintenance = dayIncidents.some((inc) => inc.attributes.status === "maintenance");
    const hasDown = dayIncidents.some((inc) => inc.attributes.status !== "maintenance");

    result.push({
      date: dayStart.toISOString().slice(0, 10),
      status: hasDown ? "down" : hasMaintenance ? "maintenance" : "up",
    });
  }

  return result;
}

function secondsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.ceil((midnight.getTime() - now.getTime()) / 1000);
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    log.warn("GET /api/betterstack/history - unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.BETTERSTACK_API_KEY;
  if (!apiKey) {
    log.error("GET /api/betterstack/history - BETTERSTACK_API_KEY not set");
    return NextResponse.json({ error: "BETTERSTACK_API_KEY is not configured" }, { status: 500 });
  }

  const ttl = secondsUntilMidnight();
  log.debug({ user: session.user.email, ttl }, "GET /api/betterstack/history");

  try {
    const allMonitors = await fetchAllMonitors(apiKey, ttl);
    const grouped = allMonitors.filter((m) =>
      GROUPED_MONITOR_NAMES.has(normalizeMonitorName(m.attributes.pronounceable_name))
    );

    log.debug({ total: allMonitors.length, grouped: grouped.length }, "fetched monitors for history");

    const from = new Date();
    from.setUTCDate(from.getUTCDate() - HISTORY_DAYS);
    from.setUTCHours(0, 0, 0, 0);

    const entries = await Promise.all(
      grouped.map(async (m) => {
        const incidents = await fetchIncidents(apiKey, m.id, from, ttl);
        return {
          name: normalizeMonitorName(m.attributes.pronounceable_name),
          history: computeDayStatuses(incidents, HISTORY_DAYS),
        };
      })
    );

    const historyMap: Record<string, DayStatus[]> = {};
    for (const { name, history } of entries) {
      historyMap[name] = history;
    }

    return NextResponse.json(historyMap, {
      headers: { "Cache-Control": "private, no-cache" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    log.error({ err }, "GET /api/betterstack/history - error");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
