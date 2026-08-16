import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Priority, TaskStatus } from "@myplanner/shared";
import { api } from "../lib/api";
import type { Task } from "../types/api";

export interface TaskFilters {
  projectId?: string;
  assigneeId?: string;
  status?: TaskStatus;
}

export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: async () => (await api.get<Task[]>("/tasks", { params: filters })).data,
  });
}

export interface CreateTaskInput {
  projectId: string;
  parentTaskId?: string;
  title: string;
  description?: string;
  assigneeId?: string;
  dueDate?: string;
  priority?: Priority;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  assigneeId?: string | null;
  dueDate?: string | null;
  priority?: Priority;
  progressPercent?: number;
  position?: number;
}

function invalidateTasks(qc: ReturnType<typeof useQueryClient>, projectId: string) {
  qc.invalidateQueries({ queryKey: ["projects", projectId] });
  qc.invalidateQueries({ queryKey: ["tasks"] });
  qc.invalidateQueries({ queryKey: ["dashboard"] });
  qc.invalidateQueries({ queryKey: ["projects"] });
}

export function useCreateTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTaskInput) => (await api.post<Task>("/tasks", input)).data,
    onSuccess: () => invalidateTasks(qc, projectId),
  });
}

export function useUpdateTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateTaskInput & { id: string }) =>
      (await api.patch<Task>(`/tasks/${id}`, input)).data,
    onSuccess: () => invalidateTasks(qc, projectId),
  });
}

export function useDeleteTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => invalidateTasks(qc, projectId),
  });
}
