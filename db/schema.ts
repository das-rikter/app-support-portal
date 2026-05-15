import { boolean, date as pgDate, index, integer, pgTable, serial, text, time as pgTime, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const incidents = pgTable("incidents", {
  id: serial("id").primaryKey(),
  product: text("product").notNull().default(""),
  function: text("function").notNull().default(""),
  owner: text("owner").notNull().default(""),
  lead: text("lead").notNull().default(""),
  severity: text("severity").notNull(),
  title: text("title").notNull(),
  date: pgDate("date").notNull(),
  startTime: pgTime("start_time").notNull(),
  closeDate: pgDate("close_date").notNull(),
  closeTime: pgTime("close_time").notNull(),
  resolutionDate: pgDate("resolution_date").notNull(),
  resolutionTime: pgTime("resolution_time").notNull(),
  downtime: integer("downtime").notNull().default(0),
  alerted: boolean("alerted").notNull().default(false),
  alertSrc: text("alert_src").notNull().default(""),
  cause: text("cause").notNull().default(""),
  dasCaused: boolean("das_caused").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (t) => [
  index("incidents_date_idx").on(t.date),
  index("incidents_product_idx").on(t.product),
  index("incidents_severity_idx").on(t.severity),
]);

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
