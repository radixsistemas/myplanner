import type { Priority, ProjectStatus, RoadmapStatus, TaskStatus } from "@myplanner/shared";
import type { Tone } from "../components/ui/Badge";

export const priorityTone: Record<Priority, Tone> = {
  LOW: "slate",
  MEDIUM: "blue",
  HIGH: "amber",
  CRITICAL: "red",
};

export const roadmapStatusTone: Record<RoadmapStatus, Tone> = {
  PLANEJADO: "slate",
  EM_ANALISE: "purple",
  INICIADO: "blue",
  PAUSADO: "amber",
  CANCELADO: "red",
  CONCLUIDO: "green",
};

export const projectStatusTone: Record<ProjectStatus, Tone> = {
  ACTIVE: "blue",
  ON_HOLD: "amber",
  COMPLETED: "green",
  CANCELLED: "red",
};

export const taskStatusTone: Record<TaskStatus, Tone> = {
  TODO: "slate",
  IN_PROGRESS: "blue",
  IN_REVIEW: "purple",
  DONE: "green",
  BLOCKED: "red",
};
