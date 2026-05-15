DROP TABLE "incidents";
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" serial PRIMARY KEY NOT NULL,
	"product" text DEFAULT '' NOT NULL,
	"function" text DEFAULT '' NOT NULL,
	"owner" text DEFAULT '' NOT NULL,
	"lead" text DEFAULT '' NOT NULL,
	"severity" text NOT NULL,
	"title" text NOT NULL,
	"date" date NOT NULL,
	"start_time" time NOT NULL,
	"close_date" date NOT NULL,
	"close_time" time NOT NULL,
	"outage" integer DEFAULT 0 NOT NULL,
	"resolution_date" date NOT NULL,
	"resolution_time" time NOT NULL,
	"downtime" integer DEFAULT 0 NOT NULL,
	"alerted" boolean DEFAULT false NOT NULL,
	"alert_src" text DEFAULT '' NOT NULL,
	"cause" text DEFAULT '' NOT NULL,
	"das_caused" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
