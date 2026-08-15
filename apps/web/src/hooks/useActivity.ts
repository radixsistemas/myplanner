import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EntityType } from "@mapa-expansao/shared";
import { api } from "../lib/api";
import type { ActivityEntry } from "../types/api";

export function useActivity(entityType: EntityType, entityId: string | undefined) {
  return useQuery({
    queryKey: ["activity", entityType, entityId],
    queryFn: async () => (await api.get<ActivityEntry[]>(`/activity/${entityType}/${entityId}`)).data,
    enabled: !!entityId,
  });
}

export function useAddComment(entityType: EntityType, entityId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) =>
      (await api.post<ActivityEntry>(`/activity/${entityType}/${entityId}/comments`, { body })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["activity", entityType, entityId] }),
  });
}
