CREATE TABLE "incidents" (
	"id" serial PRIMARY KEY NOT NULL,
	"product" text DEFAULT '' NOT NULL,
	"fn" text DEFAULT '' NOT NULL,
	"owner" text DEFAULT '' NOT NULL,
	"lead" text DEFAULT '' NOT NULL,
	"sev" text NOT NULL,
	"title" text NOT NULL,
	"month" text DEFAULT '' NOT NULL,
	"date" text DEFAULT '' NOT NULL,
	"start_time" text DEFAULT '' NOT NULL,
	"closure_date" text DEFAULT '' NOT NULL,
	"closure_time" text DEFAULT '' NOT NULL,
	"incident_length" text DEFAULT '' NOT NULL,
	"resolution_date" text DEFAULT '' NOT NULL,
	"resolution_time" text DEFAULT '' NOT NULL,
	"downtime" text DEFAULT '' NOT NULL,
	"alerted" boolean DEFAULT false NOT NULL,
	"alert_src" text DEFAULT '' NOT NULL,
	"cause" text DEFAULT '' NOT NULL,
	"reoccurring" boolean DEFAULT false NOT NULL,
	"das_caused" boolean DEFAULT false NOT NULL,
	"postmortem" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"role" text DEFAULT 'Viewer' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
