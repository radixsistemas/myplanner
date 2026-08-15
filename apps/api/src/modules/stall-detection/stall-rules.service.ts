import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/http-error";
import { assertCanManageTeam } from "../../lib/authorization";
import type { AuthenticatedUser } from "../../middleware/auth";
import type { StallRuleInput } from "./stall-rules.schemas";

const DEFAULT_GLOBAL_RULE = {
  scope: "GLOBAL" as const,
  tolerancePercent: 0.15,
  minToleranceDays: 7,
  maxToleranceDays: 45,
  reminderIntervalDays: 7,
};

/** A regra global é um singleton gerenciado pela aplicação (criada com defaults no primeiro acesso). */
export async function getGlobalRule() {
  const rule = await prisma.stallRule.findFirst({ where: { scope: "GLOBAL" } });
  if (rule) return rule;
  return prisma.stallRule.create({ data: DEFAULT_GLOBAL_RULE });
}

export async function getTeamRule(teamId: string) {
  return prisma.stallRule.findFirst({ where: { scope: "TEAM", teamId } });
}

/** Regra efetiva de um time: override do time se existir, senão a regra global. */
export async function getEffectiveRule(teamId: string) {
  const teamRule = await getTeamRule(teamId);
  if (teamRule) return teamRule;
  return getGlobalRule();
}

export async function updateGlobalRule(user: AuthenticatedUser, input: StallRuleInput) {
  if (user.globalRole !== "ADMIN") {
    throw HttpError.forbidden("Apenas administradores podem configurar a regra global de estagnação");
  }
  const existing = await getGlobalRule();
  return prisma.stallRule.update({ where: { id: existing.id }, data: input });
}

export async function upsertTeamRule(user: AuthenticatedUser, teamId: string, input: StallRuleInput) {
  await assertCanManageTeam(user, teamId);
  const existing = await getTeamRule(teamId);
  if (existing) {
    return prisma.stallRule.update({ where: { id: existing.id }, data: input });
  }
  return prisma.stallRule.create({ data: { ...input, scope: "TEAM", teamId } });
}

export async function deleteTeamRule(user: AuthenticatedUser, teamId: string) {
  await assertCanManageTeam(user, teamId);
  const existing = await getTeamRule(teamId);
  if (existing) await prisma.stallRule.delete({ where: { id: existing.id } });
}

export async function listRules(user: AuthenticatedUser) {
  const global = await getGlobalRule();
  const teamRules =
    user.globalRole === "ADMIN"
      ? await prisma.stallRule.findMany({ where: { scope: "TEAM" }, include: { team: true } })
      : await prisma.stallRule.findMany({
          where: { scope: "TEAM", team: { members: { some: { userId: user.id, teamRole: "MANAGER" } } } },
          include: { team: true },
        });
  return { global, teamRules };
}
