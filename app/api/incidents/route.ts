import { db } from "@/db";
import { incidents } from "@/db/schema";
import { auth } from "@/lib/auth";
import { formToInsert, rowToIncident } from "@/lib/incidentDb";
import logger from "@/lib/logger";
import { IncidentFormSchema } from "@/schemas";
import { desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const log = logger.child({ route: "incidents" });

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    log.warn("GET /api/incidents - unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  log.debug({ user: session.user.email }, "GET /api/incidents");
  const rows = await db.select().from(incidents).orderBy(desc(incidents.date));
  log.debug({ count: rows.length }, "GET /api/incidents - fetched");
  return NextResponse.json(rows.map(rowToIncident));
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    log.warn("POST /api/incidents - unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "Admin") {
    log.warn({ user: session.user.email }, "POST /api/incidents - forbidden");
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    log.warn("POST /api/incidents - invalid JSON body");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = IncidentFormSchema.safeParse(body);
  if (!parsed.success) {
    log.warn({ errors: parsed.error.flatten() }, "POST /api/incidents - validation failed");
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const [row] = await db
    .insert(incidents)
    .values(formToInsert(parsed.data))
    .returning();

  log.info({ id: row.id, title: row.title, user: session.user.email }, "incident created");
  return NextResponse.json(rowToIncident(row), { status: 201 });
}
