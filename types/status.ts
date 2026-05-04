// types/status.ts

export type StatusValue =
    | "operational"
    | "degraded"
    | "partial_outage"
    | "major_outage"
    | "maintenance"
    | "unknown";

export type Service = {
    id: string;
    name: string;
    category: "infrastructure" | "advertising";
    statusPageUrl: string;
    statusApiUrl?: string;        // ← add this line
    watchComponents?: string[];   // ← add this line
    rssFeedUrls?: string[];
    description: string;
    currentStatus: StatusValue;
    lastChecked: string;
    statusMessage?: string;
};

export type Incident = {
    id: string;
    serviceId: string;
    title: string;
    status: "investigating" | "identified" | "monitoring" | "resolved";
    updatedAt: string;
    url: string;
};