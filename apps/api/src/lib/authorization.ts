import type { TeamRole } from "@prisma/client";
import { prisma } from "./prisma";
import { HttpError } from "./http-error";
import type { AuthenticatedUser } from "../middleware/auth";

export async function getTeamRole(userId: string, teamId: string): Promise<TeamRole | null> {
  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
  return membership?.teamRole ?? null;
}

/** Admin global e gestores do time podem gerenciar (criar/editar/excluir) recursos do time. */
export async function assertCanManageTeam(user: AuthenticatedUser, teamId: string): Promise<void> {
  if (user.globalRole === "ADMIN") return;
  const role = await getTeamRole(user.id, teamId);
  if (role !== "MANAGER") throw HttpError.forbidden("Apenas gestores do time podem realizar esta ação");
}

/** Qualquer membro do time (ou admin) pode visualizar recursos do time. */
export async function assertTeamMember(user: AuthenticatedUser, teamId: string): Promise<void> {
  if (user.globalRole === "ADMIN") return;
  const role = await getTeamRole(user.id, teamId);
  if (!role) throw HttpError.forbidden("Você não é membro deste time");
}
