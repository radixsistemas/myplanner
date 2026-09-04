import { computeStallStatus, type StallResult } from "@myplanner/shared";
import { prisma } from "../lib/prisma";
import { getEffectiveRule } from "./stall-detection/stall-rules.service";
import { ACTIVE_PROJECT_STATUSES, ACTIVE_ROADMAP_STATUSES } from "./stall-detection/stall-status";
import { publicUserSelect } from "../lib/selects";
import type { AuthenticatedUser } from "../middleware/auth";

async function getUserTeamIds(userId: string): Promise<string[]> {
  const memberships = await prisma.teamMember.findMany({ where: { userId }, select: { teamId: true } });
  return memberships.map((m) => m.teamId);
}

/** Times visíveis no dashboard: filtro explícito > preferências salvas > todos os times do usuário. */
async function resolveVisibleTeamIds(user: AuthenticatedUser, teamId?: string): Promise<string[] | undefined> {
  if (teamId) return [teamId];
  if (user.globalRole === "ADMIN") return undefined;

  const prefs = await prisma.dashboardTeamPreference.findMany({
    where: { userId: user.id },
    select: { teamId: true },
  });
  if (prefs.length > 0) return prefs.map((p) => p.teamId);
  return getUserTeamIds(user.id);
}

export interface DashboardFilters {
  teamId?: string;
  ownerId?: string;
}

export async function getDashboard(user: AuthenticatedUser, filters: DashboardFilters) {
  const teamIds = await resolveVisibleTeamIds(user, filters.teamId);
  const teamWhere = teamIds ? { teamId: { in: teamIds } } : {};

  const [roadmapItems, projects] = await Promise.all([
    prisma.roadmapItem.findMany({
      where: { ...teamWhere, ...(filters.ownerId ? { ownerId: filters.ownerId } : {}) },
      include: {
        owner: { select: publicUserSelect },
        team: true,
        phases: { orderBy: { order: "asc" } },
        project: { select: { id: true } },
      },
      orderBy: { targetDate: "asc" },
    }),
    prisma.project.findMany({
      where: { ...teamWhere, archivedAt: null, ...(filters.ownerId ? { ownerId: filters.ownerId } : {}) },
      include: {
        owner: { select: publicUserSelect },
        team: true,
        tasks: { where: { parentTaskId: null }, select: { progressPercent: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const ruleCache = new Map<string, Awaited<ReturnType<typeof getEffectiveRule>>>();
  async function ruleFor(teamId: string) {
    const cached = ruleCache.get(teamId);
    if (cached) return cached;
    const rule = await getEffectiveRule(teamId);
    ruleCache.set(teamId, rule);
    return rule;
  }

  const roadmapWithStall = await Promise.all(
    roadmapItems.map(async (item) => {
      if (!(ACTIVE_ROADMAP_STATUSES as readonly string[]).includes(item.status)) {
        return { ...item, stall: undefined as StallResult | undefined };
      }
      const rule = await ruleFor(item.teamId);
      const stall = computeStallStatus(
        { startDate: item.createdAt, targetDate: item.targetDate, lastActivityAt: item.lastActivityAt },
        rule,
      );
      return { ...item, stall: stall as StallResult | undefined };
    }),
  );

  const projectsWithStall = await Promise.all(
    projects.map(async (project) => {
      const progressPercent = project.tasks.length
        ? Math.round(project.tasks.reduce((sum, t) => sum + t.progressPercent, 0) / project.tasks.length)
        : 0;
      const { tasks: _tasks, ...rest } = project;

      if (!(ACTIVE_PROJECT_STATUSES as readonly string[]).includes(project.status)) {
        return { ...rest, stall: undefined as StallResult | undefined, progressPercent };
      }
      const rule = await ruleFor(project.teamId);
      const stall = computeStallStatus(
        { startDate: project.startedAt, targetDate: project.targetDate, lastActivityAt: project.lastActivityAt },
        rule,
      );
      return { ...rest, stall: stall as StallResult | undefined, progressPercent };
    }),
  );

  const stalledItems: Array<{ type: "ROADMAP_ITEM" | "PROJECT"; id: string; title: string } & StallResult> = [
    ...roadmapWithStall
      .filter((item): item is typeof item & { stall: StallResult } => !!item.stall?.isStalled)
      .map((item) => ({ type: "ROADMAP_ITEM" as const, id: item.id, title: item.title, ...item.stall })),
    ...projectsWithStall
      .filter((project): project is typeof project & { stall: StallResult } => !!project.stall?.isStalled)
      .map((project) => ({ type: "PROJECT" as const, id: project.id, title: project.title, ...project.stall })),
  ];

  const roadmapByHorizon = {
    SHORT: roadmapWithStall.filter((item) => item.horizon === "SHORT"),
    MEDIUM: roadmapWithStall.filter((item) => item.horizon === "MEDIUM"),
    LONG: roadmapWithStall.filter((item) => item.horizon === "LONG"),
  };

  const overdueTasks = await prisma.task.findMany({
    where: {
      dueDate: { lt: new Date() },
      status: { not: "DONE" },
      project: teamIds ? { teamId: { in: teamIds } } : {},
      ...(filters.ownerId ? { assigneeId: filters.ownerId } : {}),
    },
    include: { assignee: { select: publicUserSelect }, project: { select: { id: true, title: true } } },
    orderBy: { dueDate: "asc" },
  });

  return {
    activeProjects: projectsWithStall.filter((p) => p.status === "ACTIVE" || p.status === "ON_HOLD"),
    roadmapByHorizon,
    stalledItems,
    overdueTasks,
  };
}
