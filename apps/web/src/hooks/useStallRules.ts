import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { StallRule } from "../types/api";

export interface StallRuleInput {
  tolerancePercent: number;
  minToleranceDays: number;
  maxToleranceDays: number;
  reminderIntervalDays: number;
}

export function useStallRules() {
  return useQuery({
    queryKey: ["stall-rules"],
    queryFn: async () => (await api.get<{ global: StallRule; teamRules: StallRule[] }>("/stall-rules")).data,
  });
}

export function useUpdateGlobalStallRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: StallRuleInput) => (await api.put<StallRule>("/stall-rules/global", input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stall-rules"] }),
  });
}

export function useUpsertTeamStallRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ teamId, ...input }: StallRuleInput & { teamId: string }) =>
      (await api.put<StallRule>(`/stall-rules/teams/${teamId}`, input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stall-rules"] }),
  });
}

export function useDeleteTeamStallRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (teamId: string) => api.delete(`/stall-rules/teams/${teamId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stall-rules"] }),
  });
}
