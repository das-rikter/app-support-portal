import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { BugReportSchema, CreateBugReportFormSchema } from "@/schemas";
import type { BugReport, CreateBugReportForm } from "@/types";

// --- Query key factory ---
export const bugReportKeys = {
  all: ["bug-reports"] as const,
  lists: () => [...bugReportKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...bugReportKeys.lists(), { filters }] as const,
  detail: (id: string) => [...bugReportKeys.all, "detail", id] as const,
};

// --- Hooks ---

export function useBugReports(weekId?: string) {
  return useQuery({
    queryKey: bugReportKeys.list({ weekId }),
    queryFn: async (): Promise<BugReport[]> => {
      const data = await apiClient.get<unknown>("/bug-reports", { weekId });
      return BugReportSchema.array().parse(data);
    },
  });
}

export function useBugReport(id: string) {
  return useQuery({
    queryKey: bugReportKeys.detail(id),
    queryFn: async (): Promise<BugReport> => {
      const data = await apiClient.get<unknown>(`/bug-reports/${id}`);
      return BugReportSchema.parse(data);
    },
    enabled: !!id,
  });
}

export function useCreateBugReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateBugReportForm): Promise<BugReport> => {
      const validated = CreateBugReportFormSchema.parse(payload);
      const data = await apiClient.post<unknown>("/bug-reports", validated);
      return BugReportSchema.parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bugReportKeys.lists() });
    },
  });
}
