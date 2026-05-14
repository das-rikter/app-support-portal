import { boolean, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const incidents = pgTable("incidents", {
  id: serial("id").primaryKey(),
  product: text("product").notNull().default(""),
  fn: text("fn").notNull().default(""),
  owner: text("owner").notNull().default(""),
  lead: text("lead").notNull().default(""),
  sev: text("sev").notNull(),
  title: text("title").notNull(),
  month: text("month").notNull().default(""),
  date: text("date").notNull().default(""),
  startTime: text("start_time").notNull().default(""),
  closureDate: text("closure_date").notNull().default(""),
  closureTime: text("closure_time").notNull().default(""),
  incidentLength: text("incident_length").notNull().default(""),
  resolutionDate: text("resolution_date").notNull().default(""),
  resolutionTime: text("resolution_time").notNull().default(""),
  downtime: text("downtime").notNull().default(""),
  alerted: boolean("alerted").notNull().default(false),
  alertSrc: text("alert_src").notNull().default(""),
  cause: text("cause").notNull().default(""),
  reoccurring: boolean("reoccurring").notNull().default(false),
  dasCaused: boolean("das_caused").notNull().default(false),
  postmortem: text("postmortem"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull().default(""),
  role: text("role").notNull().default("Viewer"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export type IncidentRow = typeof incidents.$inferSelect;
export type NewIncident = typeof incidents.$inferInsert;
export type UserRow = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
