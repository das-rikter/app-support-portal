// components/status/ServiceCard.tsx

import { ExternalLink, Clock, AlertCircle, Wrench } from "lucide-react";
import { Service } from "@/types/status";
import { VendorStatusResult } from "@/types/statuspage-api";
import StatusBadge from "@/components/status/StatusBadge";

type ServiceCardProps = {
    service: Service;
    liveData?: VendorStatusResult;
};

function formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}

export default function ServiceCard({ service, liveData }: ServiceCardProps) {
    // Use live status if available, fall back to static
    const currentStatus = liveData?.currentStatus ?? service.currentStatus;
    const lastChecked = liveData?.lastChecked ?? service.lastChecked;
    const hasIncident = (liveData?.activeIncidents?.length ?? 0) > 0;
    const hasMaintenance = (liveData?.scheduledMaintenances?.length ?? 0) > 0;
    const latestIncident = liveData?.activeIncidents?.[0];
    const nextMaintenance = liveData?.scheduledMaintenances?.[0];

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">

            {/* Top row: name + status badge */}
            <div className="flex items-start justify-between gap-4">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {service.name}
                </h3>
                <StatusBadge status={currentStatus} size="sm" />
            </div>

            {/* Description */}
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                {service.description}
            </p>

            {/* Active incident block */}
            {hasIncident && latestIncident && (
                <div className="mt-3 rounded-md border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-900/20">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
                                {latestIncident.name}
                            </p>
                            <p className="mt-1 text-xs text-orange-700 dark:text-orange-400 line-clamp-2">
                                {latestIncident.latestUpdate}
                            </p>
                            {latestIncident.affectedComponents.length > 0 && (
                                <p className="mt-1 text-xs text-orange-600 dark:text-orange-500">
                                    Affected: {latestIncident.affectedComponents.slice(0, 3).join(", ")}
                                    {latestIncident.affectedComponents.length > 3 && " and more"}
                                </p>
                            )}
                            <a
                                href={latestIncident.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-orange-700 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-200"
                            >
                                View full incident <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Scheduled maintenance block (only if no active incident) */}
            {!hasIncident && hasMaintenance && nextMaintenance && (
                <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                    <div className="flex items-start gap-2">
                        <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                        <div>
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                                {nextMaintenance.name}
                            </p>
                            <p className="mt-0.5 text-xs text-blue-600 dark:text-blue-400">
                                Scheduled: {formatTime(nextMaintenance.scheduledFor)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Manual status message fallback (for ad platforms) */}
            {service.statusMessage && !hasIncident && (
                <p className="mt-2 rounded-md bg-yellow-50 px-3 py-2 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                    {service.statusMessage}
                </p>
            )}

            {/* Bottom row */}
            <div className="mt-4 flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                    <Clock className="h-3 w-3" />
                    {liveData ? "Live · " : ""}
                    {formatTime(lastChecked)}
                </span>
                <a
                    href={service.statusPageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                    View status page
                    <ExternalLink className="h-3 w-3" />
                </a>
            </div>
        </div>
    );
}