import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/http-error";
import { assertCanManageTeam, assertTeamMember, getTeamRole } from "../../lib/authorization";
import { recordActivity } from "../activity/activity.service";
import { publicUserSelect } from "../../lib/selects";
import type { AuthenticatedUser } from "../../middleware/auth";
import type { CreateTaskInput, UpdateTaskInput } from "./tasks.schemas";

async function recomputeParentProgress(parentTaskId: string | null | undefined) {
  if (!parentTaskId) return;
  const agg = await prisma.task.aggregate({ where: { parentTaskId }, _avg: { progressPercent: true } });
  await prisma.task.update({
    where: { id: parentTaskId },
    data: { progressPercent: Math.round(agg._avg.progressPercent ?? 0) },
  });
}

const COLLABORATOR_EDITABLE_FIELDS = new Set(["status", "progressPercent", "description"]);

async function assertCanEditTask(
  user: AuthenticatedUser,
  task: { assigneeId: string | null },
  teamId: string,
  patchKeys: string[],
) {
  if (user.globalRole === "ADMIN") return;
  const role = await getTeamRole(user.id, teamId);
  if (role === "MANAGER") return;
  if (task.assigneeId === user.id) {
    const disallowed = patchKeys.filter((key) => !COLLABORATOR_EDITABLE_FIELDS.has(key));
    if (disallowed.length > 0) {
      throw HttpError.forbidden("Como colaborador, você só pode atualizar status, progresso e descrição desta tarefa");
    }
    return;
  }
  throw HttpError.forbidden("Você só pode editar tarefas atribuídas a você");
}

export async function listTasks(
  user: AuthenticatedUser,
  filters: { projectId?: string; assigneeId?: string; status?: string },
) {
  if (filters.projectId) {
    const project = await prisma.project.findUnique({ where: { id: filters.projectId }, select: { teamId: true } });
    if (!project) throw HttpError.notFound("Projeto não encontrado");
    await assertTeamMember(user, project.teamId);
  } else if (user.globalRole !== "ADMIN" && !filters.assigneeId) {
    filters.assigneeId = user.id;
  }

  return prisma.task.findMany({
    where: {
      ...(filters.projectId ? { projectId: filters.projectId } : {}),
      ...(filters.assigneeId ? { assigneeId: filters.assigneeId } : {}),
      ...(filters.status ? { status: filters.status as never } : {}),
    },
    include: { assignee: { select: publicUserSelect }, project: { select: { id: true, title: true, teamId: true } } },
    orderBy: [{ dueDate: "asc" }, { position: "asc" }],
  });
}

export async function getTask(user: AuthenticatedUser, id: string) {
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignee: { select: publicUserSelect },
      subtasks: { include: { assignee: { select: publicUserSelect } } },
      project: true,
    },
  });
  if (!task) throw HttpError.notFound("Tarefa não encontrada");
  await assertTeamMember(user, task.project.teamId);
  return task;
}

export async function createTask(user: AuthenticatedUser, input: CreateTaskInput) {
  const project = await prisma.project.findUnique({ where: { id: input.projectId } });
  if (!project) throw HttpError.notFound("Projeto não encontrado");
  await assertCanManageTeam(user, project.teamId);

  if (input.parentTaskId) {
    const parent = await prisma.task.findUnique({ where: { id: input.parentTaskId } });
    if (!parent) throw HttpError.notFound("Tarefa pai não encontrada");
    if (parent.parentTaskId) {
      throw HttpError.badRequest("Só é permitido até 2 níveis de hierarquia (tarefa e subtarefa)");
    }
    if (parent.projectId !== input.projectId) {
      throw HttpError.badRequest("Subtarefa deve pertencer ao mesmo projeto da tarefa pai");
    }
  }

  const maxPosition = await prisma.task.aggregate({
    where: { projectId: input.projectId, parentTaskId: input.parentTaskId ?? null },
    _max: { position: true },
  });

  const task = await prisma.task.create({
    data: {
      projectId: input.projectId,
      parentTaskId: input.parentTaskId,
      title: input.title,
      description: input.description,
      assigneeId: input.assigneeId,
      dueDate: input.dueDate,
      priority: input.priority,
      position: (maxPosition._max.position ?? -1) + 1,
    },
  });

  if (input.parentTaskId) await recomputeParentProgress(input.parentTaskId);

  await recordActivity({
    entityType: "TASK",
    entityId: task.id,
    userId: user.id,
    type: "CREATED",
    body: "Tarefa criada",
  });

  return task;
}

export async function updateTask(user: AuthenticatedUser, id: string, input: UpdateTaskInput) {
  const existing = await prisma.task.findUnique({ where: { id }, include: { project: true } });
  if (!existing) throw HttpError.notFound("Tarefa não encontrada");

  await assertCanEditTask(user, existing, existing.project.teamId, Object.keys(input));

  const data: UpdateTaskInput = { ...input };
  // Concluída sempre significa 100%, mesmo que o formulário tenha enviado um progressPercent
  // desatualizado junto (ex: o slider não foi mexido ao marcar a tarefa como concluída).
  if (input.status === "DONE") {
    data.progressPercent = 100;
  }

  const updated = await prisma.task.update({ where: { id }, data });

  if (existing.parentTaskId) await recomputeParentProgress(existing.parentTaskId);

  if (input.status && input.status !== existing.status) {
    await recordActivity({
      entityType: "TASK",
      entityId: id,
      userId: user.id,
      type: input.status === "DONE" ? "TASK_COMPLETED" : "STATUS_CHANGE",
      metadata: { from: existing.status, to: input.status },
    });
  } else {
    await recordActivity({ entityType: "TASK", entityId: id, userId: user.id, type: "FIELD_UPDATE" });
  }

  return updated;
}

export async function deleteTask(user: AuthenticatedUser, id: string) {
  const existing = await prisma.task.findUnique({ where: { id }, include: { project: true } });
  if (!existing) throw HttpError.notFound("Tarefa não encontrada");
  await assertCanManageTeam(user, existing.project.teamId);
  await prisma.task.delete({ where: { id } });
  if (existing.parentTaskId) await recomputeParentProgress(existing.parentTaskId);
}
