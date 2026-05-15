import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import logger from "@/lib/logger";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const log = logger.child({ route: "users/[id]" });

const UpdateRoleSchema = z.object({
  role: z.enum(["Admin", "Viewer"]),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    log.warn("PUT /api/users/[id] - unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "Admin") {
    log.warn({ user: session.user.email }, "PUT /api/users/[id] - forbidden");
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isInteger(idNum) || idNum < 1) {
    log.warn({ id }, "PUT /api/users/[id] - invalid id");
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    log.warn({ id: idNum }, "PUT /api/users/[id] - invalid JSON body");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UpdateRoleSchema.safeParse(body);
  if (!parsed.success) {
    log.warn({ id: idNum }, "PUT /api/users/[id] - invalid role");
    return NextResponse.json({ error: "role must be Admin or Viewer" }, { status: 422 });
  }

  const [row] = await db
    .update(users)
    .set({ role: parsed.data.role, updatedAt: new Date() })
    .where(eq(users.id, idNum))
    .returning();

  if (!row) {
    log.warn({ id: idNum }, "PUT /api/users/[id] - not found");
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  log.info({ id: idNum, email: row.email, role: row.role, by: session.user.email }, "user role updated");
  return NextResponse.json({
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    log.warn("DELETE /api/users/[id] - unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "Admin") {
    log.warn({ user: session.user.email }, "DELETE /api/users/[id] - forbidden");
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isInteger(idNum) || idNum < 1) {
    log.warn({ id }, "DELETE /api/users/[id] - invalid id");
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const selfEmail = session.user.email ?? "";
  const [target] = await db.select().from(users).where(eq(users.id, idNum)).limit(1);
  if (!target) {
    log.warn({ id: idNum }, "DELETE /api/users/[id] - not found");
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (target.email.toLowerCase() === selfEmail.toLowerCase()) {
    log.warn({ id: idNum, user: selfEmail }, "DELETE /api/users/[id] - attempted self-delete");
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  await db.delete(users).where(eq(users.id, idNum));
  log.info({ id: idNum, email: target.email, by: selfEmail }, "user deleted");
  return NextResponse.json({ success: true });
}
