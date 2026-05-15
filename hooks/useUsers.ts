import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AppUser } from "@/schemas";
import { fetchJson } from "@/lib/fetch-utils";

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
};

export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: () => fetchJson<AppUser[]>("/api/users"),
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: number; role: "Admin" | "Viewer" }) =>
      fetchJson<AppUser>(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.lists() }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      fetchJson<{ success: boolean }>(`/api/users/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.lists() }),
  });
}
