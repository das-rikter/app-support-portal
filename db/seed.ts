import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { incidents } from "./schema";
import { RAW_INCIDENTS } from "../lib/incidentData";

/** "M/D/YYYY" → "YYYY-MM-DD" */
function parseDate(s: string): string {
  const [m, d, y] = s.split("/");
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

/** "H:MM AM/PM" or "HH:MM" (24-hour) → "HH:MM:SS" */
function parseTime(s: string): string {
  const trimmed = s.trim();
  const upper = trimmed.toUpperCase();
  if (upper.endsWith("AM") || upper.endsWith("PM")) {
    const isPM = upper.endsWith("PM");
    const timePart = trimmed.slice(0, -2).trim();
    const [hStr, mStr] = timePart.split(":");
    let h = parseInt(hStr, 10);
    const min = parseInt(mStr, 10);
    if (isPM && h !== 12) h += 12;
    if (!isPM && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`;
  }
  const [h, m] = trimmed.split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}:00`;
}

/** "H:MM" or "HHH:MM" → total minutes */
function parseDurationMinutes(s: string): number {
  const [h, m] = s.split(":");
  return parseInt(h, 10) * 60 + parseInt(m, 10);
}

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(client);

  console.log("Seeding incidents…");

  const rows = RAW_INCIDENTS.map((inc) => ({
    product: inc.product,
    function: inc.function,
    owner: inc.owner,
    lead: inc.lead,
    severity: inc.severity,
    title: inc.title,
    date: parseDate(inc.date),
    startTime: parseTime(inc.startTime),
    closeDate: parseDate(inc.closeDate),
    closeTime: parseTime(inc.closeTime),
    outage: parseDurationMinutes(inc.outage),
    resolutionDate: parseDate(inc.resolutionDate),
    resolutionTime: parseTime(inc.resolutionTime),
    downtime: parseDurationMinutes(inc.downtime),
    alerted: inc.alerted === 1,
    alertSrc: inc.alertSrc,
    cause: inc.cause,
    dasCaused: inc.dasCaused === 1,
  }));

  await db.insert(incidents).values(rows);
  console.log(`✓ Inserted ${rows.length} incidents.`);

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
