import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/http-error";
import { assertCanManageTeam, assertTeamMember } from "../../lib/authorization";
import { recordActivity } from "../activity/activity.service";
import { publicUserSelect } from "../../lib/selects";
import { attachProjectStall } from "../stall-detection/stall-status";
import type { AuthenticatedUser } from "../../middleware/auth";
import type { CreateProjectInput, UpdateProjectInput } from "./projects.schemas";

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

export async function computeProjectProgress(projectId: string): Promise<number> {
  const agg = await prisma.task.aggregate({
    where: { projectId, parentTaskId: null },
    _avg: { progressPercent: true },
  });
  return Math.round(agg._avg.progressPercent ?? 0);
}

export async function listProjects(
  user: AuthenticatedUser,
  filters: { teamId?: string; status?: string; ownerId?: string },
) {
  const teamScope = await resolveTeamScope(user, filters.teamId);
  const projects = await prisma.project.findMany({
    where: {
      ...teamScope,
      ...(filters.status ? { status: filters.status as never } : {}),
      ...(filters.ownerId ? { ownerId: filters.ownerId } : {}),
    },
    include: {
      owner: { select: publicUserSelect },
      team: true,
      roadmapItem: true,
      _count: { select: { tasks: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return Promise.all(
    projects.map(async (project) => {
      const withProgress = { ...project, progressPercent: await computeProjectProgress(project.id) };
      return attachProjectStall(withProgress);
    }),
  );
}

export async function getProject(user: AuthenticatedUser, id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: { select: publicUserSelect },
      team: true,
      roadmapItem: true,
      tasks: {
        where: { parentTaskId: null },
        include: {
          assignee: { select: publicUserSelect },
          subtasks: { include: { assignee: { select: publicUserSelect } }, orderBy: { position: "asc" } },
        },
        orderBy: { position: "asc" },
      },
    },
  });
  if (!project) throw HttpError.notFound("Projeto não encontrado");
  await assertTeamMember(user, project.teamId);
  const withProgress = { ...project, progressPercent: await computeProjectProgress(project.id) };
  return attachProjectStall(withProgress);
}

export async function createProject(user: AuthenticatedUser, input: CreateProjectInput) {
  await assertCanManageTeam(user, input.teamId);

  const project = await prisma.project.create({
    data: {
      teamId: input.teamId,
      title: input.title,
      description: input.description,
      ownerId: input.ownerId ?? user.id,
      priority: input.priority,
      targetDate: input.targetDate,
    },
  });

  await recordActivity({
    entityType: "PROJECT",
    entityId: project.id,
    userId: user.id,
    type: "CREATED",
    body: "Projeto criado",
  });

  return project;
}

export async function updateProject(user: AuthenticatedUser, id: string, input: UpdateProjectInput) {
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) throw HttpError.notFound("Projeto não encontrado");
  await assertCanManageTeam(user, existing.teamId);

  const updated = await prisma.project.update({ where: { id }, data: input });

  if (input.status && input.status !== existing.status) {
    await recordActivity({
      entityType: "PROJECT",
      entityId: id,
      userId: user.id,
      type: "STATUS_CHANGE",
      metadata: { from: existing.status, to: input.status },
    });
  } else {
    await recordActivity({ entityType: "PROJECT", entityId: id, userId: user.id, type: "FIELD_UPDATE" });
  }

  return updated;
}

export async function deleteProject(user: AuthenticatedUser, id: string) {
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) throw HttpError.notFound("Projeto não encontrado");
  await assertCanManageTeam(user, existing.teamId);
  await prisma.project.delete({ where: { id } });
}
