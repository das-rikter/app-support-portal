import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

declare global {
  // eslint-disable-next-line no-var
  var _pgClient: ReturnType<typeof postgres> | undefined;
}

if (!global._pgClient) {
  global._pgClient = postgres(process.env.DATABASE_URL, { max: 10 });
}

export const db = drizzle(global._pgClient, { schema });
