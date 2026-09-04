import type {
  ActivityType,
  EntityType,
  GlobalRole,
  Horizon,
  PhaseStatus,
  Priority,
  ProjectStatus,
  RoadmapStatus,
  TaskStatus,
  TeamRole,
  Theme,
} from "@myplanner/shared";

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  globalRole: GlobalRole;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  teamRole: TeamRole;
  joinedAt: string;
  user: PublicUser;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  members: TeamMember[];
}

export interface NotificationPreference {
  id: string;
  userId: string;
  stallAlertsEmail: boolean;
  weeklySummaryEmail: boolean;
}

export interface DashboardTeamPreference {
  id: string;
  userId: string;
  teamId: string;
  team: { id: string; name: string };
}

export interface UserProfile extends PublicUser {
  theme: Theme;
  createdAt: string;
  notificationPreference: NotificationPreference | null;
  teamMemberships: { teamId: string; teamRole: TeamRole; team: { id: string; name: string } }[];
  dashboardTeams: DashboardTeamPreference[];
}

export interface RoadmapPhase {
  id: string;
  roadmapItemId: string;
  name: string;
  description: string | null;
  order: number;
  estimatedStartDate: string | null;
  estimatedEndDate: string | null;
  status: PhaseStatus;
}

export interface RoadmapItem {
  id: string;
  teamId: string;
  title: string;
  description: string | null;
  horizon: Horizon;
  targetDate: string | null;
  targetQuarter: string | null;
  targetYear: number | null;
  ownerId: string;
  priority: Priority;
  status: RoadmapStatus;
  hasPhases: boolean;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
  owner: PublicUser;
  createdBy?: PublicUser;
  team: { id: string; name: string };
  phases: RoadmapPhase[];
  project: { id: string } | null;
  stall?: StallResult;
}

export interface StallResult {
  totalDurationDays: number;
  toleranceDays: number;
  daysSinceLastActivity: number;
  isStalled: boolean;
  daysUntilStall: number;
}

export interface Task {
  id: string;
  projectId: string;
  parentTaskId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  assigneeId: string | null;
  dueDate: string | null;
  priority: Priority;
  progressPercent: number;
  position: number;
  lastActivityAt: string;
  createdAt: string;
  assignee: PublicUser | null;
  subtasks?: Task[];
  project?: { id: string; title: string; teamId?: string };
}

export interface Project {
  id: string;
  teamId: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  ownerId: string;
  priority: Priority;
  roadmapItemId: string | null;
  targetDate: string | null;
  startedAt: string;
  lastActivityAt: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  owner: PublicUser;
  team: { id: string; name: string };
  roadmapItem: { id: string; title: string } | null;
  tasks?: Task[];
  _count?: { tasks: number };
  progressPercent: number;
  stall?: StallResult;
}

export interface ChecklistItem {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  completedAt: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityEntry {
  id: string;
  entityType: EntityType;
  entityId: string;
  userId: string;
  type: ActivityType;
  body: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: PublicUser;
}

export interface StallRule {
  id: string;
  scope: "GLOBAL" | "TEAM";
  teamId: string | null;
  tolerancePercent: number;
  minToleranceDays: number;
  maxToleranceDays: number;
  reminderIntervalDays: number;
  team?: { id: string; name: string };
}

export interface StalledItem {
  type: "ROADMAP_ITEM" | "PROJECT";
  id: string;
  title: string;
  totalDurationDays: number;
  toleranceDays: number;
  daysSinceLastActivity: number;
  isStalled: boolean;
  daysUntilStall: number;
}

export interface DashboardResponse {
  activeProjects: Project[];
  roadmapByHorizon: Record<Horizon, RoadmapItem[]>;
  stalledItems: StalledItem[];
  overdueTasks: Task[];
}
