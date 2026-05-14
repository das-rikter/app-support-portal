import { auth } from "@/lib/auth";
import { db } from "@/db";
import { incidents } from "@/db/schema";
import { formToInsert, rowToIncident } from "@/lib/incidentDb";
import logger from "@/lib/logger";
import { IncidentFormSchema } from "@/schemas";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const log = logger.child({ route: "incidents/[id]" });

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    log.warn("GET /api/incidents/[id] — unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isInteger(idNum) || idNum < 1) {
    log.warn({ id }, "GET /api/incidents/[id] — invalid id");
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  log.debug({ id: idNum, user: session.user.email }, "GET /api/incidents/[id]");
  const [row] = await db.select().from(incidents).where(eq(incidents.id, idNum)).limit(1);
  if (!row) {
    log.debug({ id: idNum }, "GET /api/incidents/[id] — not found");
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(rowToIncident(row));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    log.warn("PUT /api/incidents/[id] — unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "Admin") {
    log.warn({ user: session.user.email }, "PUT /api/incidents/[id] — forbidden");
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isInteger(idNum) || idNum < 1) {
    log.warn({ id }, "PUT /api/incidents/[id] — invalid id");
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    log.warn({ id: idNum }, "PUT /api/incidents/[id] — invalid JSON body");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = IncidentFormSchema.safeParse(body);
  if (!parsed.success) {
    log.warn({ id: idNum, errors: parsed.error.flatten() }, "PUT /api/incidents/[id] — validation failed");
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const [row] = await db
    .update(incidents)
    .set({ ...formToInsert(parsed.data), updatedAt: new Date() })
    .where(eq(incidents.id, idNum))
    .returning();

  if (!row) {
    log.warn({ id: idNum }, "PUT /api/incidents/[id] — not found");
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  log.info({ id: idNum, title: row.title, user: session.user.email }, "incident updated");
  return NextResponse.json(rowToIncident(row));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    log.warn("DELETE /api/incidents/[id] — unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "Admin") {
    log.warn({ user: session.user.email }, "DELETE /api/incidents/[id] — forbidden");
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isInteger(idNum) || idNum < 1) {
    log.warn({ id }, "DELETE /api/incidents/[id] — invalid id");
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const [row] = await db
    .delete(incidents)
    .where(eq(incidents.id, idNum))
    .returning();

  if (!row) {
    log.warn({ id: idNum }, "DELETE /api/incidents/[id] — not found");
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  log.info({ id: idNum, title: row.title, user: session.user.email }, "incident deleted");
  return NextResponse.json({ success: true });
}
