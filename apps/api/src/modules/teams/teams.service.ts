import type { TeamRole } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/http-error";
import { assertCanManageTeam } from "../../lib/authorization";
import { publicUserSelect } from "../../lib/selects";
import type { AuthenticatedUser } from "../../middleware/auth";

export async function listTeams(user: AuthenticatedUser) {
  if (user.globalRole === "ADMIN") {
    return prisma.team.findMany({
      include: { members: { include: { user: { select: publicUserSelect } } } },
      orderBy: { name: "asc" },
    });
  }
  return prisma.team.findMany({
    where: { members: { some: { userId: user.id } } },
    include: { members: { include: { user: { select: publicUserSelect } } } },
    orderBy: { name: "asc" },
  });
}

export async function getTeam(user: AuthenticatedUser, teamId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: { include: { user: { select: publicUserSelect } } } },
  });
  if (!team) throw HttpError.notFound("Time não encontrado");
  if (user.globalRole !== "ADMIN" && !team.members.some((m) => m.userId === user.id)) {
    throw HttpError.forbidden("Você não é membro deste time");
  }
  return team;
}

export async function createTeam(data: { name: string; description?: string }) {
  return prisma.team.create({ data });
}

export async function updateTeam(
  user: AuthenticatedUser,
  teamId: string,
  data: { name?: string; description?: string },
) {
  await assertCanManageTeam(user, teamId);
  return prisma.team.update({ where: { id: teamId }, data });
}

export async function addMember(
  user: AuthenticatedUser,
  teamId: string,
  data: { userId: string; teamRole: TeamRole },
) {
  await assertCanManageTeam(user, teamId);
  const existing = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: data.userId } },
  });
  if (existing) throw HttpError.conflict("Usuário já é membro deste time");
  return prisma.teamMember.create({
    data: { teamId, userId: data.userId, teamRole: data.teamRole },
    include: { user: { select: publicUserSelect } },
  });
}

export async function updateMemberRole(
  user: AuthenticatedUser,
  teamId: string,
  memberUserId: string,
  teamRole: TeamRole,
) {
  await assertCanManageTeam(user, teamId);
  return prisma.teamMember.update({
    where: { teamId_userId: { teamId, userId: memberUserId } },
    data: { teamRole },
  });
}

export async function removeMember(user: AuthenticatedUser, teamId: string, memberUserId: string) {
  await assertCanManageTeam(user, teamId);
  await prisma.teamMember.delete({ where: { teamId_userId: { teamId, userId: memberUserId } } });
}
