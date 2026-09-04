import { computeStallStatus, type StallResult } from "@myplanner/shared";
import { getEffectiveRule } from "./stall-rules.service";

/** Status em que o item ainda está em andamento e pode ser considerado "parado". */
export const ACTIVE_ROADMAP_STATUSES = ["PLANEJADO", "EM_ANALISE", "INICIADO", "PAUSADO"] as const;
export const ACTIVE_PROJECT_STATUSES = ["ACTIVE", "ON_HOLD"] as const;

function isActiveRoadmapStatus(status: string): boolean {
  return (ACTIVE_ROADMAP_STATUSES as readonly string[]).includes(status);
}

function isActiveProjectStatus(status: string): boolean {
  return (ACTIVE_PROJECT_STATUSES as readonly string[]).includes(status);
}

/**
 * Anexa o cálculo de estagnação a um item de roadmap, usando a regra efetiva (time > global).
 * Itens concluídos ou cancelados nunca são considerados parados.
 */
export async function attachRoadmapStall<
  T extends { teamId: string; status: string; createdAt: Date; targetDate: Date | null; lastActivityAt: Date },
>(item: T): Promise<T & { stall?: StallResult }> {
  if (!isActiveRoadmapStatus(item.status)) return { ...item, stall: undefined };

  const rule = await getEffectiveRule(item.teamId);
  const stall = computeStallStatus(
    { startDate: item.createdAt, targetDate: item.targetDate, lastActivityAt: item.lastActivityAt },
    rule,
  );
  return { ...item, stall };
}

/**
 * Anexa o cálculo de estagnação a um projeto, usando a regra efetiva (time > global).
 * Projetos concluídos ou cancelados nunca são considerados parados.
 */
export async function attachProjectStall<
  T extends { teamId: string; status: string; startedAt: Date; targetDate: Date | null; lastActivityAt: Date },
>(project: T): Promise<T & { stall?: StallResult }> {
  if (!isActiveProjectStatus(project.status)) return { ...project, stall: undefined };

  const rule = await getEffectiveRule(project.teamId);
  const stall = computeStallStatus(
    { startDate: project.startedAt, targetDate: project.targetDate, lastActivityAt: project.lastActivityAt },
    rule,
  );
  return { ...project, stall };
}
