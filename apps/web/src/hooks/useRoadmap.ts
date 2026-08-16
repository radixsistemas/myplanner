import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Horizon, Priority, RoadmapStatus } from "@myplanner/shared";
import { api } from "../lib/api";
import type { RoadmapItem, RoadmapPhase } from "../types/api";

export interface RoadmapFilters {
  teamId?: string;
  horizon?: Horizon;
  status?: RoadmapStatus;
  ownerId?: string;
}

export function useRoadmapItems(filters: RoadmapFilters = {}) {
  return useQuery({
    queryKey: ["roadmap-items", filters],
    queryFn: async () => (await api.get<RoadmapItem[]>("/roadmap-items", { params: filters })).data,
  });
}

export function useRoadmapItem(id: string | undefined) {
  return useQuery({
    queryKey: ["roadmap-items", id],
    queryFn: async () => (await api.get<RoadmapItem>(`/roadmap-items/${id}`)).data,
    enabled: !!id,
  });
}

export interface RoadmapPhaseInput {
  name: string;
  description?: string;
  estimatedStartDate?: string;
  estimatedEndDate?: string;
}

export interface CreateRoadmapItemInput {
  teamId: string;
  title: string;
  description?: string;
  horizon?: Horizon;
  targetDate?: string;
  targetQuarter?: string;
  targetYear?: number;
  ownerId?: string;
  priority?: Priority;
  hasPhases?: boolean;
  phases?: RoadmapPhaseInput[];
}

function invalidateRoadmap(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["roadmap-items"] });
  qc.invalidateQueries({ queryKey: ["dashboard"] });
}

export function useCreateRoadmapItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateRoadmapItemInput) => (await api.post<RoadmapItem>("/roadmap-items", input)).data,
    onSuccess: () => invalidateRoadmap(qc),
  });
}

export type UpdateRoadmapItemInput = Partial<Omit<CreateRoadmapItemInput, "targetDate" | "targetQuarter">> & {
  status?: RoadmapStatus;
  targetDate?: string | null;
  targetQuarter?: string | null;
};

export function useUpdateRoadmapItem(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateRoadmapItemInput) => (await api.patch<RoadmapItem>(`/roadmap-items/${id}`, input)).data,
    onSuccess: () => invalidateRoadmap(qc),
  });
}

export function useDeleteRoadmapItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/roadmap-items/${id}`),
    onSuccess: () => invalidateRoadmap(qc),
  });
}

export function usePromoteRoadmapItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.post(`/roadmap-items/${id}/promote`)).data,
    onSuccess: () => {
      invalidateRoadmap(qc);
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useAddPhase(roadmapItemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RoadmapPhaseInput) =>
      (await api.post<RoadmapPhase>(`/roadmap-items/${roadmapItemId}/phases`, input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roadmap-items", roadmapItemId] }),
  });
}

export function useUpdatePhase(roadmapItemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ phaseId, ...input }: { phaseId: string } & Partial<RoadmapPhaseInput> & { status?: string }) =>
      (await api.patch<RoadmapPhase>(`/roadmap-items/${roadmapItemId}/phases/${phaseId}`, input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roadmap-items", roadmapItemId] }),
  });
}

export function useDeletePhase(roadmapItemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (phaseId: string) => api.delete(`/roadmap-items/${roadmapItemId}/phases/${phaseId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roadmap-items", roadmapItemId] }),
  });
}
