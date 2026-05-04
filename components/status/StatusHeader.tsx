// components/status/StatusHeader.tsx

import { CheckCircle, AlertTriangle, XCircle, RefreshCw, Wrench } from "lucide-react";
import { getOverallStatus } from "@/lib/status-data";

const overallConfig = {
    operational: {
        label: "All Systems Operational",
        description: "All monitored platforms are reporting normal operation.",
        icon: CheckCircle,
        classes: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300",
        iconClasses: "text-green-500 dark:text-green-400",
    },
    maintenance: {                      // ← new
        label: "Scheduled Maintenance",
        description: "One or more platforms have scheduled maintenance in progress or upcoming.",
        icon: Wrench,
        classes: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300",
        iconClasses: "text-blue-500 dark:text-blue-400",
    },
    issues: {
        label: "Some Systems Experiencing Issues",
        description: "One or more platforms are reporting degraded performance or partial outages.",
        icon: AlertTriangle,
        classes: "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300",
        iconClasses: "text-yellow-500 dark:text-yellow-400",
    },
    outage: {
        label: "Major Outage Detected",
        description: "One or more platforms are reporting a major outage. Check individual services below.",
        icon: XCircle,
        classes: "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300",
        iconClasses: "text-red-500 dark:text-red-400",
    },
};

export default function StatusHeader() {
    const overall = getOverallStatus();
    const config = overallConfig[overall];
    const Icon = config.icon;

    const today = new Date().toLocaleString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });

    return (
        <div className={`rounded-lg border p-5 ${config.classes}`}>
            <div className="flex items-center gap-3">
                <Icon className={`h-6 w-6 flex-shrink-0 ${config.iconClasses}`} />
                <h2 className="text-lg font-semibold">{config.label}</h2>
            </div>
            <p className="mt-1.5 text-sm opacity-80">{config.description}</p>
            <p className="mt-3 flex items-center gap-1.5 text-xs opacity-60">
                <RefreshCw className="h-3 w-3" />
                Last updated: {today}
            </p>
        </div>
    );
}