import type { ActivityType, EntityType, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/http-error";
import { assertTeamMember } from "../../lib/authorization";
import type { AuthenticatedUser } from "../../middleware/auth";

interface RecordActivityInput {
  entityType: EntityType;
  entityId: string;
  userId: string;
  type: ActivityType;
  body?: string;
  metadata?: Record<string, unknown>;
}

/** Registra uma entrada de atividade e atualiza lastActivityAt da entidade (base da detecção de estagnação). */
export async function recordActivity(input: RecordActivityInput) {
  const entry = await prisma.activityEntry.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      userId: input.userId,
      type: input.type,
      body: input.body,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });
  await touchLastActivity(input.entityType, input.entityId);
  return entry;
}

async function touchLastActivity(entityType: EntityType, entityId: string) {
  const now = new Date();
  if (entityType === "ROADMAP_ITEM") {
    await prisma.roadmapItem.update({ where: { id: entityId }, data: { lastActivityAt: now } });
    return;
  }
  if (entityType === "PROJECT") {
    await prisma.project.update({ where: { id: entityId }, data: { lastActivityAt: now } });
    return;
  }
  // Atividade em uma tarefa também conta como atividade do projeto pai (evita falso alerta de estagnação).
  const task = await prisma.task.update({
    where: { id: entityId },
    data: { lastActivityAt: now },
    select: { projectId: true },
  });
  await prisma.project.update({ where: { id: task.projectId }, data: { lastActivityAt: now } });
}

async function getEntityTeamId(entityType: EntityType, entityId: string): Promise<string> {
  if (entityType === "ROADMAP_ITEM") {
    const item = await prisma.roadmapItem.findUnique({ where: { id: entityId }, select: { teamId: true } });
    if (!item) throw HttpError.notFound("Item de roadmap não encontrado");
    return item.teamId;
  }
  if (entityType === "PROJECT") {
    const project = await prisma.project.findUnique({ where: { id: entityId }, select: { teamId: true } });
    if (!project) throw HttpError.notFound("Projeto não encontrado");
    return project.teamId;
  }
  const task = await prisma.task.findUnique({
    where: { id: entityId },
    select: { project: { select: { teamId: true } } },
  });
  if (!task) throw HttpError.notFound("Tarefa não encontrada");
  return task.project.teamId;
}

export async function assertEntityAccess(
  user: AuthenticatedUser,
  entityType: EntityType,
  entityId: string,
): Promise<void> {
  const teamId = await getEntityTeamId(entityType, entityId);
  await assertTeamMember(user, teamId);
}

export async function listActivity(entityType: EntityType, entityId: string) {
  return prisma.activityEntry.findMany({
    where: { entityType, entityId },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function addComment(entityType: EntityType, entityId: string, userId: string, body: string) {
  return recordActivity({ entityType, entityId, userId, type: "COMMENT", body });
}
