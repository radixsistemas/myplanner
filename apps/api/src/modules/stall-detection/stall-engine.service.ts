import { computeStallStatus } from "@myplanner/shared";
import { prisma } from "../../lib/prisma";
import { getEffectiveRule } from "./stall-rules.service";
import { notifyStalled } from "../notifications/notifications.service";
import { ACTIVE_PROJECT_STATUSES, ACTIVE_ROADMAP_STATUSES } from "./stall-status";

export interface StallScanResult {
  checked: number;
  stalled: number;
  notified: number;
}

/**
 * Varre todos os itens de roadmap e projetos ativos, calcula a tolerância proporcional
 * ao prazo de cada um (via regra efetiva do time) e dispara notificações de estagnação
 * respeitando o throttle de reenvio. Chamado pelo job agendado e pelo script manual.
 */
export async function runStallCheck(): Promise<StallScanResult> {
  let checked = 0;
  let stalled = 0;
  let notified = 0;

  const roadmapItems = await prisma.roadmapItem.findMany({
    where: { status: { in: [...ACTIVE_ROADMAP_STATUSES] } },
    include: {
      team: { include: { members: { where: { teamRole: "MANAGER" } } } },
    },
  });

  for (const item of roadmapItems) {
    checked++;
    const rule = await getEffectiveRule(item.teamId);
    const status = computeStallStatus(
      { startDate: item.createdAt, targetDate: item.targetDate, lastActivityAt: item.lastActivityAt },
      rule,
    );
    if (!status.isStalled) continue;
    stalled++;

    const recipients = new Set<string>([item.ownerId, ...item.team.members.map((m) => m.userId)]);

    for (const recipientId of recipients) {
      const sent = await notifyStalled({
        entityType: "ROADMAP_ITEM",
        entityId: item.id,
        entityTitle: item.title,
        recipientUserId: recipientId,
        daysSinceLastActivity: status.daysSinceLastActivity,
        toleranceDays: status.toleranceDays,
        reminderIntervalDays: rule.reminderIntervalDays,
      });
      if (sent) notified++;
    }
  }

  const projects = await prisma.project.findMany({
    where: { status: { in: [...ACTIVE_PROJECT_STATUSES] } },
    include: {
      team: { include: { members: { where: { teamRole: "MANAGER" } } } },
    },
  });

  for (const project of projects) {
    checked++;
    const rule = await getEffectiveRule(project.teamId);
    const status = computeStallStatus(
      { startDate: project.startedAt, targetDate: project.targetDate, lastActivityAt: project.lastActivityAt },
      rule,
    );
    if (!status.isStalled) continue;
    stalled++;

    const recipients = new Set<string>([project.ownerId, ...project.team.members.map((m) => m.userId)]);

    for (const recipientId of recipients) {
      const sent = await notifyStalled({
        entityType: "PROJECT",
        entityId: project.id,
        entityTitle: project.title,
        recipientUserId: recipientId,
        daysSinceLastActivity: status.daysSinceLastActivity,
        toleranceDays: status.toleranceDays,
        reminderIntervalDays: rule.reminderIntervalDays,
      });
      if (sent) notified++;
    }
  }

  return { checked, stalled, notified };
}
