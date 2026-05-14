import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import logger from "@/lib/logger";
import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";

const log = logger.child({ route: "users" });

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    log.warn("GET /api/users — unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "Admin") {
    log.warn({ user: session.user.email }, "GET /api/users — forbidden");
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  log.debug({ user: session.user.email }, "GET /api/users");
  const rows = await db.select().from(users).orderBy(asc(users.email));
  log.debug({ count: rows.length }, "GET /api/users — fetched");
  return NextResponse.json(
    rows.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    }))
  );
}
