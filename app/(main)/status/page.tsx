// app/(main)/status/page.tsx

"use client";

import { servicesByCategory } from "@/lib/status-data";
import StatusHeader from "@/components/status/StatusHeader";
import ServiceCard from "@/components/status/ServiceCard";
import { useVendorStatus } from "@/hooks/useVendorStatus";
import { RefreshCw } from "lucide-react";

export default function StatusPage() {
    const { data: liveData, isLoading, isError, dataUpdatedAt, refetch } = useVendorStatus();

    // Helper: find live data for a specific service by ID
    function getLiveData(serviceId: string) {
        return liveData?.find((d) => d.serviceId === serviceId);
    }

    return (
        <div className="mx-auto max-w-4xl py-6">

            {/* Page title + manual refresh button */}
            <div className="mb-6 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Platform Status
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Monitor the status of third-party platforms your team depends on.
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                >
                    <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
                    {isLoading ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {/* Error banner */}
            {isError && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                    Unable to fetch live vendor statuses. Showing last known data.
                </div>
            )}

            {/* Overall health banner */}
            <div className="mb-8">
                <StatusHeader />
            </div>

            {/* Live data timestamp */}
            {dataUpdatedAt > 0 && (
                <p className="mb-4 text-xs text-gray-400 dark:text-gray-600">
                    Live data last fetched: {new Date(dataUpdatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })} · Auto-refreshes every 5 minutes
                </p>
            )}

            {/* Infrastructure Services */}
            <section className="mb-10">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Infrastructure & Communications
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    {servicesByCategory.infrastructure.map((service) => (
                        <ServiceCard
                            key={service.id}
                            service={service}
                            liveData={getLiveData(service.id)}
                        />
                    ))}
                </div>
            </section>

            {/* Advertising Platforms */}
            <section className="mb-10">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Advertising Platforms
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    {servicesByCategory.advertising.map((service) => (
                        <ServiceCard
                            key={service.id}
                            service={service}
                            liveData={getLiveData(service.id)}
                        />
                    ))}
                </div>
            </section>

            <p className="text-center text-xs text-gray-400 dark:text-gray-600">
                Infrastructure status sourced from official vendor APIs. Ad platform statuses are manually maintained.
            </p>
        </div>
    );
}