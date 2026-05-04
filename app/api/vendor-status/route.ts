// app/api/vendor-status/route.ts

import { NextResponse } from "next/server";
import { services } from "@/lib/status-data";
import { XMLParser } from "fast-xml-parser";
import {
    StatuspageSummary,
    VendorStatusResult,
    StatuspageIndicator,
} from "@/types/statuspage-api";
import { StatusValue } from "@/types/status";

const xmlParser = new XMLParser({ ignoreAttributes: false });

// --- Helpers ---

function mapIndicator(indicator: StatuspageIndicator): StatusValue {
    switch (indicator) {
        case "none": return "operational";
        case "minor": return "degraded";
        case "major": return "partial_outage";
        case "critical": return "major_outage";
        default: return "unknown";
    }
}

function isRssFeed(url: string): boolean {
    return url.endsWith(".rss") || url.includes("azurestatuscdn");
}

// --- RSS/XML handler (Azure + AWS) ---

async function fetchRssFeed(url: string): Promise<{ title: string; description: string; pubDate: string }[]> {
    try {
        const res = await fetch(url, { next: { revalidate: 300 } });
        if (!res.ok) return [];
        const xml = await res.text();
        const parsed = xmlParser.parse(xml);

        // Handle both RSS and Atom feed formats
        const items =
            parsed?.rss?.channel?.item ||      // standard RSS
            parsed?.feed?.entry ||             // Atom (Azure uses this)
            [];

        const itemArray = Array.isArray(items) ? items : [items];

        return itemArray.map((item: Record<string, unknown>) => ({
            title: String(item.title ?? "Unknown incident"),
            description: Array.isArray(item.description)
                ? String(item.description[1] ?? item.description[0] ?? "")
                : String(item.description ?? item.summary ?? item.content ?? ""),
            pubDate: String(item.pubDate ?? item.updated ?? item.published ?? new Date().toISOString()),
        }));
    } catch {
        return [];
    }
}



async function fetchRssVendorStatus(
    serviceId: string,
    feedUrls: string[]
): Promise<VendorStatusResult> {
    try {
        // Fetch all feeds in parallel
        const allFeedItems = await Promise.all(feedUrls.map(fetchRssFeed));
        const allItems = allFeedItems.flat();

        // 👇 ADD THIS BLOCK
        console.log("RSS DEBUG:", {
            serviceId,
            totalItems: allItems.length,
            firstItem: allItems[0] ?? null,
        });
        // 👆 END OF ADDED BLOCK

        // An item is an active incident if it was published in the last 24 hours
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        const recentItems = allItems.filter((item) => {
            const pubTime = new Date(item.pubDate).getTime();
            return pubTime > cutoff;
        });

        const hasIncidents = recentItems.length > 0;
        const currentStatus: StatusValue = hasIncidents ? "degraded" : "operational";

        return {
            serviceId,
            currentStatus,
            activeIncidents: recentItems.map((item) => ({
                name: item.title,
                impact: "minor",
                latestUpdate: item.description.replace(/<[^>]*>/g, "").slice(0, 300),
                updatedAt: item.pubDate,
                url: "",
                affectedComponents: [],
            })),
            scheduledMaintenances: [],
            lastChecked: new Date().toISOString(),
        };
    } catch (error) {
        return {
            serviceId,
            currentStatus: "unknown",
            activeIncidents: [],
            scheduledMaintenances: [],
            lastChecked: new Date().toISOString(),
            error: error instanceof Error ? error.message : "Failed to fetch RSS",
        };
    }
}


/* async function fetchRssVendorStatus(
    serviceId: string,
    feedUrls: string[]
): Promise<VendorStatusResult> {
    try {
        // Fetch all feeds in parallel
        const allFeedItems = await Promise.all(feedUrls.map(fetchRssFeed));
        const allItems = allFeedItems.flat();

        // An item is an active incident if it was published in the last 24 hours
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        const recentItems = allItems.filter((item) => {
            const pubTime = new Date(item.pubDate).getTime();
            return pubTime > cutoff;
        });

        const hasIncidents = recentItems.length > 0;
        const currentStatus: StatusValue = hasIncidents ? "degraded" : "operational";

        return {
            serviceId,
            currentStatus,
            activeIncidents: recentItems.map((item) => ({
                name: item.title,
                impact: "minor",
                latestUpdate: item.description.replace(/<[^>]*>/g, "").slice(0, 300),
                updatedAt: item.pubDate,
                url: "",
                affectedComponents: [],
            })),
            scheduledMaintenances: [],
            lastChecked: new Date().toISOString(),
        };
    } catch (error) {
        return {
            serviceId,
            currentStatus: "unknown",
            activeIncidents: [],
            scheduledMaintenances: [],
            lastChecked: new Date().toISOString(),
            error: error instanceof Error ? error.message : "Failed to fetch RSS",
        };
    }
} */

// --- JSON/Statuspage handler (Twilio, SendGrid, Mailgun) ---

async function fetchJsonVendorStatus(
    serviceId: string,
    apiUrl: string,
    watchComponents?: string[]
): Promise<VendorStatusResult> {
    try {
        const response = await fetch(apiUrl, { next: { revalidate: 300 } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data: StatuspageSummary = await response.json();

        const relevantIncidents = data.incidents.filter((incident) => {
            if (!watchComponents || watchComponents.length === 0) return true;
            return incident.components.some((c) =>
                watchComponents.some((keyword) =>
                    c.name.toLowerCase().includes(keyword.toLowerCase())
                )
            );
        });

        const relevantComponents = watchComponents && watchComponents.length > 0
            ? data.components.filter((c) =>
                watchComponents.some((keyword) =>
                    c.name.toLowerCase().includes(keyword.toLowerCase())
                )
            )
            : data.components;

        let currentStatus: StatusValue;
        if (watchComponents && relevantComponents.length > 0) {
            const hasOutage = relevantComponents.some((c) => c.status === "major_outage");
            const hasPartial = relevantComponents.some((c) => c.status === "partial_outage");
            const hasDegraded = relevantComponents.some((c) => c.status === "degraded_performance");
            const hasMaintenance = relevantComponents.some((c) => c.status === "under_maintenance");
            if (hasOutage) currentStatus = "major_outage";
            else if (hasPartial) currentStatus = "partial_outage";
            else if (hasDegraded) currentStatus = "degraded";
            else if (hasMaintenance) currentStatus = "maintenance";
            else currentStatus = "operational";
        } else {
            currentStatus = mapIndicator(data.status.indicator);
        }

        if (data.scheduled_maintenances.some((m) => m.status === "in_progress")) {
            currentStatus = "maintenance";
        }

        return {
            serviceId,
            currentStatus,
            activeIncidents: relevantIncidents.map((incident) => ({
                name: incident.name,
                impact: incident.impact,
                latestUpdate: incident.incident_updates[0]?.body ?? "No updates available.",
                updatedAt: incident.incident_updates[0]?.created_at ?? incident.updated_at,
                url: incident.shortlink,
                affectedComponents: incident.components.map((c) => c.name),
            })),
            scheduledMaintenances: data.scheduled_maintenances
                .filter((m) => m.status !== "completed")
                .map((m) => ({
                    name: m.name,
                    scheduledFor: m.scheduled_for ?? m.created_at,
                    url: m.shortlink,
                })),
            lastChecked: new Date().toISOString(),
        };
    } catch (error) {
        return {
            serviceId,
            currentStatus: "unknown",
            activeIncidents: [],
            scheduledMaintenances: [],
            lastChecked: new Date().toISOString(),
            error: error instanceof Error ? error.message : "Failed to fetch",
        };
    }
}

// --- Main GET handler ---

/* export async function GET() {
    const liveServices = services.filter((s) => s.statusApiUrl || s.rssFeedUrls?.length);

    const results = await Promise.all(
        liveServices.map((s) => {
            // Vendor explicitly uses rssFeedUrls
            if (s.rssFeedUrls && s.rssFeedUrls.length > 0) {
                return fetchRssVendorStatus(s.id, s.rssFeedUrls);
            }

            const urls = s.statusApiUrl!.split(",").map((u) => u.trim());

            // Vendor uses statusApiUrl but it points to an RSS/XML feed
            if (urls.some(isRssFeed)) {
                return fetchRssVendorStatus(s.id, urls);
            }

            // Vendor uses a JSON/Statuspage API
            return fetchJsonVendorStatus(s.id, urls[0], s.watchComponents);
        })
    );

    return NextResponse.json(results);
} */

export async function GET() {
    const allServices = services;
    const liveServices = services.filter((s) => s.statusApiUrl || s.rssFeedUrls?.length);

    //console.log("ALL SERVICES:", allServices.map((s) => ({ id: s.id, hasApiUrl: !!s.statusApiUrl, hasRssUrls: !!s.rssFeedUrls })));
    //console.log("LIVE SERVICES:", liveServices.map((s) => s.id));

    const results = await Promise.all(
        liveServices.map((s) => {
            if (s.rssFeedUrls && s.rssFeedUrls.length > 0) {
                //  console.log("→ RSS (rssFeedUrls):", s.id, s.rssFeedUrls) - used to debug response from service;
                return fetchRssVendorStatus(s.id, s.rssFeedUrls);
            }

            const urls = s.statusApiUrl!.split(",").map((u) => u.trim());

            if (urls.some(isRssFeed)) {
                //   console.log("→ RSS (statusApiUrl):", s.id, urls);
                return fetchRssVendorStatus(s.id, urls);
            }

            console.log("→ JSON:", s.id, urls[0]);
            return fetchJsonVendorStatus(s.id, urls[0], s.watchComponents);
        })
    );

    return NextResponse.json(results);
}