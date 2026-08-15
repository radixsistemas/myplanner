import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TeamRole } from "@mapa-expansao/shared";
import { api } from "../lib/api";
import type { Team } from "../types/api";

export function useTeams() {
  return useQuery({
    queryKey: ["teams"],
    queryFn: async () => (await api.get<Team[]>("/teams")).data,
  });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string }) => (await api.post<Team>("/teams", input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teams"] }),
  });
}

export function useAddTeamMember(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: string; teamRole: TeamRole }) =>
      (await api.post(`/teams/${teamId}/members`, input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teams"] }),
  });
}

export function useUpdateTeamMemberRole(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, teamRole }: { userId: string; teamRole: TeamRole }) =>
      (await api.patch(`/teams/${teamId}/members/${userId}`, { teamRole })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teams"] }),
  });
}

export function useRemoveTeamMember(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => api.delete(`/teams/${teamId}/members/${userId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teams"] }),
  });
}
