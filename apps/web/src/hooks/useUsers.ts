import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { GlobalRole, Theme } from "@myplanner/shared";
import { api } from "../lib/api";
import type { PublicUser, UserProfile } from "../types/api";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => (await api.get<PublicUser[]>("/users")).data,
  });
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: async (input: { name?: string; theme?: Theme; avatarUrl?: string | null }) =>
      (await api.patch<UserProfile>("/users/me", input)).data,
  });
}

export function useUpdateNotificationPreferences() {
  return useMutation({
    mutationFn: async (input: { stallAlertsEmail?: boolean; weeklySummaryEmail?: boolean }) =>
      (await api.patch("/users/me/notification-preferences", input)).data,
  });
}

export function useUpdateDashboardTeams() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (teamIds: string[]) => (await api.put("/users/me/dashboard-teams", { teamIds })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard"] }),
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, globalRole }: { userId: string; globalRole: GlobalRole }) =>
      (await api.patch(`/users/${userId}/role`, { globalRole })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}
