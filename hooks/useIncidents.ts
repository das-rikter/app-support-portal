import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { IncidentSchema, CreateIncidentFormSchema } from "@/schemas";
import type { Incident, CreateIncidentForm } from "@/types";

// --- Query key factory ---
export const incidentKeys = {
  all: ["incidents"] as const,
  lists: () => [...incidentKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...incidentKeys.lists(), { filters }] as const,
  detail: (id: string) => [...incidentKeys.all, "detail", id] as const,
};

// --- Hooks ---

export function useIncidents(filters?: Record<string, string | undefined>) {
  return useQuery({
    queryKey: incidentKeys.list(filters ?? {}),
    queryFn: async (): Promise<Incident[]> => {
      const data = await apiClient.get<unknown>("/incidents", filters);
      return IncidentSchema.array().parse(data);
    },
  });
}

export function useIncident(id: string) {
  return useQuery({
    queryKey: incidentKeys.detail(id),
    queryFn: async (): Promise<Incident> => {
      const data = await apiClient.get<unknown>(`/incidents/${id}`);
      return IncidentSchema.parse(data);
    },
    enabled: !!id,
  });
}

export function useCreateIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateIncidentForm): Promise<Incident> => {
      const validated = CreateIncidentFormSchema.parse(payload);
      const data = await apiClient.post<unknown>("/incidents", validated);
      return IncidentSchema.parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
    },
  });
}
