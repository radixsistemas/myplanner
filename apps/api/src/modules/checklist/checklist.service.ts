import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/http-error";
import type { AuthenticatedUser } from "../../middleware/auth";
import type { CreateChecklistItemInput, UpdateChecklistItemInput } from "./checklist.schemas";

export async function listChecklistItems(user: AuthenticatedUser, includeCompleted: boolean) {
  return prisma.checklistItem.findMany({
    where: { userId: user.id, ...(includeCompleted ? {} : { completed: false }) },
    orderBy: [{ completed: "asc" }, { position: "asc" }, { createdAt: "desc" }],
  });
}

export async function createChecklistItem(user: AuthenticatedUser, input: CreateChecklistItemInput) {
  const maxPosition = await prisma.checklistItem.aggregate({
    where: { userId: user.id },
    _max: { position: true },
  });

  return prisma.checklistItem.create({
    data: {
      userId: user.id,
      title: input.title,
      position: (maxPosition._max.position ?? -1) + 1,
    },
  });
}

async function getOwnedItem(user: AuthenticatedUser, id: string) {
  const item = await prisma.checklistItem.findUnique({ where: { id } });
  if (!item || item.userId !== user.id) throw HttpError.notFound("Item do checklist não encontrado");
  return item;
}

export async function updateChecklistItem(user: AuthenticatedUser, id: string, input: UpdateChecklistItemInput) {
  const existing = await getOwnedItem(user, id);

  const completedAt =
    input.completed === undefined
      ? undefined
      : input.completed
        ? (existing.completedAt ?? new Date())
        : null;

  return prisma.checklistItem.update({
    where: { id },
    data: { ...input, ...(completedAt !== undefined ? { completedAt } : {}) },
  });
}

export async function deleteChecklistItem(user: AuthenticatedUser, id: string) {
  await getOwnedItem(user, id);
  await prisma.checklistItem.delete({ where: { id } });
}
