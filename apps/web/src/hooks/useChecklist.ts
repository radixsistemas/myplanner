import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { ChecklistItem } from "../types/api";

export function useChecklistItems(includeCompleted: boolean) {
  return useQuery({
    queryKey: ["checklist", { includeCompleted }],
    queryFn: async () =>
      (await api.get<ChecklistItem[]>("/checklist", { params: { includeCompleted } })).data,
  });
}

function invalidateChecklist(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["checklist"] });
}

export function useCreateChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) => (await api.post<ChecklistItem>("/checklist", { title })).data,
    onSuccess: () => invalidateChecklist(qc),
  });
}

export function useUpdateChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; title?: string; completed?: boolean }) =>
      (await api.patch<ChecklistItem>(`/checklist/${id}`, input)).data,
    onSuccess: () => invalidateChecklist(qc),
  });
}

export function useDeleteChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/checklist/${id}`),
    onSuccess: () => invalidateChecklist(qc),
  });
}
