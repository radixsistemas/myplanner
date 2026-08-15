import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/http-error";
import type { Theme } from "@prisma/client";

export async function listUsers() {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, globalRole: true, avatarUrl: true },
    orderBy: { name: "asc" },
  });
}

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      globalRole: true,
      theme: true,
      avatarUrl: true,
      createdAt: true,
      notificationPreference: true,
      teamMemberships: { include: { team: true } },
      dashboardTeams: { include: { team: true } },
    },
  });
  if (!user) throw HttpError.notFound("Usuário não encontrado");
  return user;
}

export async function updateProfile(
  userId: string,
  data: { name?: string; theme?: Theme; avatarUrl?: string | null },
) {
  return prisma.user.update({ where: { id: userId }, data });
}

export async function updateNotificationPreferences(
  userId: string,
  data: { stallAlertsEmail?: boolean; weeklySummaryEmail?: boolean },
) {
  return prisma.notificationPreference.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
}

export async function updateDashboardTeams(userId: string, teamIds: string[]) {
  await prisma.$transaction([
    prisma.dashboardTeamPreference.deleteMany({ where: { userId } }),
    prisma.dashboardTeamPreference.createMany({
      data: teamIds.map((teamId) => ({ userId, teamId })),
    }),
  ]);
  return prisma.dashboardTeamPreference.findMany({ where: { userId }, include: { team: true } });
}

export async function updateGlobalRole(userId: string, globalRole: "ADMIN" | "MEMBER") {
  return prisma.user.update({ where: { id: userId }, data: { globalRole } });
}
