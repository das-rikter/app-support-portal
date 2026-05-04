// components/status/StatusBadge.tsx

import { StatusValue } from "@/types/status";

type StatusBadgeProps = {
    status: StatusValue;
    size?: "sm" | "md";
};

const statusConfig: Record<StatusValue, { label: string; classes: string }> = {
    operational: {
        label: "Operational",
        classes: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    },
    degraded: {
        label: "Degraded Performance",
        classes: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    },
    partial_outage: {
        label: "Partial Outage",
        classes: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    },
    major_outage: {
        label: "Major Outage",
        classes: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    },
    maintenance: {
        label: "Under Maintenance",
        classes: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    },
    unknown: {
        label: "Unknown",
        classes: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    },
};

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
    const config = statusConfig[status];
    const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses} ${config.classes}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
            {config.label}
        </span>
    );
}