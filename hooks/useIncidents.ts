import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Incident } from "@/types/incident";
import type { IncidentForm } from "@/schemas";
import { fetchJson } from "@/lib/fetch-utils";

export const incidentKeys = {
  all: ["incidents"] as const,
  lists: () => [...incidentKeys.all, "list"] as const,
  detail: (id: number) => [...incidentKeys.all, "detail", id] as const,
};

export function useIncidents() {
  return useQuery({
    queryKey: incidentKeys.lists(),
    queryFn: () => fetchJson<Incident[]>("/api/incidents"),
  });
}

export function useCreateIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: IncidentForm) =>
      fetchJson<Incident>("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: incidentKeys.lists() }),
  });
}

export function useUpdateIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: IncidentForm & { id: number }) =>
      fetchJson<Incident>(`/api/incidents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: incidentKeys.lists() }),
  });
}

export function useDeleteIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      fetchJson<{ success: boolean }>(`/api/incidents/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: incidentKeys.lists() }),
  });
}
