import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Priority, ProjectStatus } from "@myplanner/shared";
import { api } from "../lib/api";
import type { Project } from "../types/api";

export interface ProjectFilters {
  teamId?: string;
  status?: ProjectStatus;
  ownerId?: string;
  archived?: boolean;
}

export function useProjects(filters: ProjectFilters = {}) {
  return useQuery({
    queryKey: ["projects", filters],
    queryFn: async () => (await api.get<Project[]>("/projects", { params: filters })).data,
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: async () => (await api.get<Project>(`/projects/${id}`)).data,
    enabled: !!id,
  });
}

export interface CreateProjectInput {
  teamId: string;
  title: string;
  description?: string;
  ownerId?: string;
  priority?: Priority;
  targetDate?: string;
}

function invalidateProjects(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["projects"] });
  qc.invalidateQueries({ queryKey: ["dashboard"] });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateProjectInput) => (await api.post<Project>("/projects", input)).data,
    onSuccess: () => invalidateProjects(qc),
  });
}

export function useUpdateProject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<CreateProjectInput> & { status?: ProjectStatus }) =>
      (await api.patch<Project>(`/projects/${id}`, input)).data,
    onSuccess: () => invalidateProjects(qc),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => invalidateProjects(qc),
  });
}

export function useArchiveProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.post<Project>(`/projects/${id}/archive`)).data,
    onSuccess: () => invalidateProjects(qc),
  });
}

export function useUnarchiveProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.post<Project>(`/projects/${id}/unarchive`)).data,
    onSuccess: () => invalidateProjects(qc),
  });
}
