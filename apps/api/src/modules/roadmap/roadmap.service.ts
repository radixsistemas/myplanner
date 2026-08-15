import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/http-error";
import { assertCanManageTeam, assertTeamMember } from "../../lib/authorization";
import { recordActivity } from "../activity/activity.service";
import { publicUserSelect } from "../../lib/selects";
import { attachRoadmapStall } from "../stall-detection/stall-status";
import type { AuthenticatedUser } from "../../middleware/auth";
import type {
  CreatePhaseInput,
  CreateRoadmapItemInput,
  UpdatePhaseInput,
  UpdateRoadmapItemInput,
} from "./roadmap.schemas";

async function getUserTeamIds(userId: string): Promise<string[]> {
  const memberships = await prisma.teamMember.findMany({ where: { userId }, select: { teamId: true } });
  return memberships.map((m) => m.teamId);
}

async function resolveTeamScope(user: AuthenticatedUser, teamId?: string) {
  if (teamId) {
    await assertTeamMember(user, teamId);
    return { teamId };
  }
  if (user.globalRole === "ADMIN") return {};
  const teamIds = await getUserTeamIds(user.id);
  return { teamId: { in: teamIds } };
}

export async function listRoadmapItems(
  user: AuthenticatedUser,
  filters: { teamId?: string; horizon?: string; status?: string; ownerId?: string },
) {
  const teamScope = await resolveTeamScope(user, filters.teamId);
  const items = await prisma.roadmapItem.findMany({
    where: {
      ...teamScope,
      ...(filters.horizon ? { horizon: filters.horizon as never } : {}),
      ...(filters.status ? { status: filters.status as never } : {}),
      ...(filters.ownerId ? { ownerId: filters.ownerId } : {}),
    },
    include: {
      owner: { select: publicUserSelect },
      phases: { orderBy: { order: "asc" } },
      project: true,
      team: true,
    },
    orderBy: [{ targetDate: "asc" }, { createdAt: "desc" }],
  });
  return Promise.all(items.map(attachRoadmapStall));
}

export async function getRoadmapItem(user: AuthenticatedUser, id: string) {
  const item = await prisma.roadmapItem.findUnique({
    where: { id },
    include: {
      owner: { select: publicUserSelect },
      createdBy: { select: publicUserSelect },
      phases: { orderBy: { order: "asc" } },
      project: true,
      team: true,
    },
  });
  if (!item) throw HttpError.notFound("Item de roadmap não encontrado");
  await assertTeamMember(user, item.teamId);
  return attachRoadmapStall(item);
}

export async function createRoadmapItem(user: AuthenticatedUser, input: CreateRoadmapItemInput) {
  await assertCanManageTeam(user, input.teamId);

  const item = await prisma.roadmapItem.create({
    data: {
      teamId: input.teamId,
      title: input.title,
      description: input.description,
      horizon: input.horizon,
      targetDate: input.targetDate,
      targetQuarter: input.targetQuarter,
      targetYear: input.targetYear,
      ownerId: input.ownerId ?? user.id,
      priority: input.priority,
      hasPhases: input.hasPhases,
      createdById: user.id,
      phases:
        input.hasPhases && input.phases?.length
          ? { create: input.phases.map((phase, index) => ({ ...phase, order: phase.order ?? index })) }
          : undefined,
    },
    include: { phases: { orderBy: { order: "asc" } } },
  });

  await recordActivity({
    entityType: "ROADMAP_ITEM",
    entityId: item.id,
    userId: user.id,
    type: "CREATED",
    body: "Item de roadmap criado",
  });

  return item;
}

export async function updateRoadmapItem(user: AuthenticatedUser, id: string, input: UpdateRoadmapItemInput) {
  const existing = await prisma.roadmapItem.findUnique({ where: { id } });
  if (!existing) throw HttpError.notFound("Item de roadmap não encontrado");
  await assertCanManageTeam(user, existing.teamId);

  const updated = await prisma.roadmapItem.update({
    where: { id },
    data: input,
    include: { phases: { orderBy: { order: "asc" } } },
  });

  if (input.status && input.status !== existing.status) {
    await recordActivity({
      entityType: "ROADMAP_ITEM",
      entityId: id,
      userId: user.id,
      type: "STATUS_CHANGE",
      metadata: { from: existing.status, to: input.status },
    });
  } else {
    await recordActivity({ entityType: "ROADMAP_ITEM", entityId: id, userId: user.id, type: "FIELD_UPDATE" });
  }

  return updated;
}

export async function deleteRoadmapItem(user: AuthenticatedUser, id: string) {
  const existing = await prisma.roadmapItem.findUnique({ where: { id }, include: { project: true } });
  if (!existing) throw HttpError.notFound("Item de roadmap não encontrado");
  await assertCanManageTeam(user, existing.teamId);
  if (existing.project) {
    throw HttpError.conflict("Não é possível excluir um item que já virou projeto em execução");
  }
  await prisma.roadmapItem.delete({ where: { id } });
}

export async function addPhase(user: AuthenticatedUser, roadmapItemId: string, input: CreatePhaseInput) {
  const item = await prisma.roadmapItem.findUnique({ where: { id: roadmapItemId } });
  if (!item) throw HttpError.notFound("Item de roadmap não encontrado");
  await assertCanManageTeam(user, item.teamId);

  const maxOrder = await prisma.roadmapPhase.aggregate({
    where: { roadmapItemId },
    _max: { order: true },
  });

  const phase = await prisma.roadmapPhase.create({
    data: { ...input, roadmapItemId, order: input.order ?? (maxOrder._max.order ?? -1) + 1 },
  });

  if (!item.hasPhases) {
    await prisma.roadmapItem.update({ where: { id: roadmapItemId }, data: { hasPhases: true } });
  }

  await recordActivity({
    entityType: "ROADMAP_ITEM",
    entityId: roadmapItemId,
    userId: user.id,
    type: "PHASE_UPDATE",
    body: `Fase "${phase.name}" adicionada`,
  });

  return phase;
}

export async function updatePhase(
  user: AuthenticatedUser,
  roadmapItemId: string,
  phaseId: string,
  input: UpdatePhaseInput,
) {
  const item = await prisma.roadmapItem.findUnique({ where: { id: roadmapItemId } });
  if (!item) throw HttpError.notFound("Item de roadmap não encontrado");
  await assertCanManageTeam(user, item.teamId);

  const phase = await prisma.roadmapPhase.update({ where: { id: phaseId }, data: input });

  await recordActivity({
    entityType: "ROADMAP_ITEM",
    entityId: roadmapItemId,
    userId: user.id,
    type: "PHASE_UPDATE",
    body: `Fase "${phase.name}" atualizada`,
  });

  return phase;
}

export async function deletePhase(user: AuthenticatedUser, roadmapItemId: string, phaseId: string) {
  const item = await prisma.roadmapItem.findUnique({ where: { id: roadmapItemId } });
  if (!item) throw HttpError.notFound("Item de roadmap não encontrado");
  await assertCanManageTeam(user, item.teamId);
  await prisma.roadmapPhase.delete({ where: { id: phaseId } });
}

export async function promoteToProject(user: AuthenticatedUser, roadmapItemId: string) {
  const item = await prisma.roadmapItem.findUnique({
    where: { id: roadmapItemId },
    include: { project: true },
  });
  if (!item) throw HttpError.notFound("Item de roadmap não encontrado");
  await assertCanManageTeam(user, item.teamId);
  if (item.project) throw HttpError.conflict("Este item já foi convertido em um projeto em execução");

  const project = await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({
      data: {
        teamId: item.teamId,
        title: item.title,
        description: item.description,
        ownerId: item.ownerId,
        priority: item.priority,
        roadmapItemId: item.id,
        targetDate: item.targetDate,
      },
    });
    await tx.roadmapItem.update({
      where: { id: item.id },
      data: { status: "INICIADO", lastActivityAt: new Date() },
    });
    return created;
  });

  await recordActivity({
    entityType: "ROADMAP_ITEM",
    entityId: item.id,
    userId: user.id,
    type: "STATUS_CHANGE",
    body: "Convertido em projeto em execução",
    metadata: { from: item.status, to: "INICIADO" },
  });
  await recordActivity({
    entityType: "PROJECT",
    entityId: project.id,
    userId: user.id,
    type: "CREATED",
    body: `Criado a partir do item de roadmap "${item.title}"`,
  });

  return project;
}
