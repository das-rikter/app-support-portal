// types/statuspage-api.ts

export type StatuspageIndicator = "none" | "minor" | "major" | "critical";

export type StatuspageComponentStatus =
    | "operational"
    | "degraded_performance"
    | "partial_outage"
    | "major_outage"
    | "under_maintenance";

export type StatuspageComponent = {
    id: string;
    name: string;
    status: StatuspageComponentStatus;
    updated_at: string;
    group: boolean;
    group_id: string | null;
};

export type StatuspageIncidentUpdate = {
    id: string;
    status: string;
    body: string;
    created_at: string;
};

// Regular incidents
export type StatuspageIncident = {
    id: string;
    name: string;
    status: "investigating" | "identified" | "monitoring" | "resolved";
    impact: StatuspageIndicator;
    shortlink: string;
    created_at: string;
    updated_at: string;
    incident_updates: StatuspageIncidentUpdate[];
    components: StatuspageComponent[];
};

// Scheduled maintenances — separate type with its own status values + scheduled_for field
export type StatuspageMaintenance = {
    id: string;
    name: string;
    status: "scheduled" | "in_progress" | "verifying" | "completed";
    impact: StatuspageIndicator;
    shortlink: string;
    created_at: string;
    updated_at: string;
    scheduled_for: string;
    scheduled_until: string;
    incident_updates: StatuspageIncidentUpdate[];
    components: StatuspageComponent[];
};

// Summary response — incidents and scheduled_maintenances now use different types
export type StatuspageSummary = {
    status: {
        indicator: StatuspageIndicator;
        description: string;
    };
    components: StatuspageComponent[];
    incidents: StatuspageIncident[];
    scheduled_maintenances: StatuspageMaintenance[];  // ← now uses StatuspageMaintenance
};

// Normalized result shape our app uses
export type VendorStatusResult = {
    serviceId: string;
    currentStatus: import("@/types/status").StatusValue;
    activeIncidents: {
        name: string;
        impact: string;
        latestUpdate: string;
        updatedAt: string;
        url: string;
        affectedComponents: string[];
    }[];
    scheduledMaintenances: {
        name: string;
        scheduledFor: string;
        url: string;
    }[];
    lastChecked: string;
    error?: string;
};