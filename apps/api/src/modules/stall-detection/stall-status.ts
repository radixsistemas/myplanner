import { computeStallStatus, type StallResult } from "@myplanner/shared";
import { getEffectiveRule } from "./stall-rules.service";

/** Anexa o cálculo de estagnação a um item de roadmap, usando a regra efetiva (time > global). */
export async function attachRoadmapStall<
  T extends { teamId: string; createdAt: Date; targetDate: Date | null; lastActivityAt: Date },
>(item: T): Promise<T & { stall: StallResult }> {
  const rule = await getEffectiveRule(item.teamId);
  const stall = computeStallStatus(
    { startDate: item.createdAt, targetDate: item.targetDate, lastActivityAt: item.lastActivityAt },
    rule,
  );
  return { ...item, stall };
}

/** Anexa o cálculo de estagnação a um projeto, usando a regra efetiva (time > global). */
export async function attachProjectStall<
  T extends { teamId: string; startedAt: Date; targetDate: Date | null; lastActivityAt: Date },
>(project: T): Promise<T & { stall: StallResult }> {
  const rule = await getEffectiveRule(project.teamId);
  const stall = computeStallStatus(
    { startDate: project.startedAt, targetDate: project.targetDate, lastActivityAt: project.lastActivityAt },
    rule,
  );
  return { ...project, stall };
}
