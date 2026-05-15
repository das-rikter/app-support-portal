CREATE INDEX "incidents_date_idx" ON "incidents" USING btree ("date");--> statement-breakpoint
CREATE INDEX "incidents_product_idx" ON "incidents" USING btree ("product");--> statement-breakpoint
CREATE INDEX "incidents_severity_idx" ON "incidents" USING btree ("severity");