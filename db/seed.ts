import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { incidents } from "./schema";
import { INCIDENTS } from "../lib/incidentData";

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(client);

  console.log("Seeding incidents…");

  const rows = INCIDENTS.map((inc) => ({
    product: inc.product,
    fn: inc.fn,
    owner: inc.owner,
    lead: inc.lead,
    sev: inc.sev,
    title: inc.title,
    month: inc.month,
    date: inc.date,
    startTime: inc.startTime,
    closureDate: inc.closureDate,
    closureTime: inc.closureTime,
    incidentLength: inc.incidentLength,
    resolutionDate: inc.resolutionDate,
    resolutionTime: inc.resolutionTime,
    downtime: inc.downtime,
    alerted: inc.alerted === 1,
    alertSrc: inc.alertSrc,
    cause: inc.cause,
    reoccurring: inc.reoccurring === 1,
    dasCaused: inc.dasCaused === 1,
    postmortem: inc.postmortem ?? null,
  }));

  await db.insert(incidents).values(rows);
  console.log(`✓ Inserted ${rows.length} incidents.`);

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
