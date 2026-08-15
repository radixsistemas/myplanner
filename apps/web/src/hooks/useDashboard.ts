import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { DashboardResponse } from "../types/api";

export interface DashboardFilters {
  teamId?: string;
  ownerId?: string;
}

export function useDashboard(filters: DashboardFilters = {}) {
  return useQuery({
    queryKey: ["dashboard", filters],
    queryFn: async () => (await api.get<DashboardResponse>("/dashboard", { params: filters })).data,
  });
}
