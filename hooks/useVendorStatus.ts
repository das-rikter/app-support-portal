// hooks/useVendorStatus.ts

import { useQuery } from "@tanstack/react-query";
import { VendorStatusResult } from "@/types/statuspage-api";

async function fetchVendorStatuses(): Promise<VendorStatusResult[]> {
    const res = await fetch("/api/vendor-status");
    if (!res.ok) throw new Error("Failed to fetch vendor statuses");
    return res.json();
}

export function useVendorStatus() {
    return useQuery({
        queryKey: ["vendor-status"],
        queryFn: fetchVendorStatuses,
        refetchInterval: 5 * 60 * 1000,  // re-fetch every 5 minutes
        staleTime: 4 * 60 * 1000,        // consider data stale after 4 minutes
        retry: 2,                         // retry twice on failure before showing error
    });
}