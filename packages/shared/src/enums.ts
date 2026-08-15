export const GLOBAL_ROLES = ["ADMIN", "MEMBER"] as const;
export type GlobalRole = (typeof GLOBAL_ROLES)[number];

export const TEAM_ROLES = ["MANAGER", "COLLABORATOR"] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

export const THEMES = ["LIGHT", "DARK", "SYSTEM"] as const;
export type Theme = (typeof THEMES)[number];

export const HORIZONS = ["SHORT", "MEDIUM", "LONG"] as const;
export type Horizon = (typeof HORIZONS)[number];

export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const ROADMAP_STATUSES = [
  "PLANEJADO",
  "EM_ANALISE",
  "INICIADO",
  "PAUSADO",
  "CANCELADO",
  "CONCLUIDO",
] as const;
export type RoadmapStatus = (typeof ROADMAP_STATUSES)[number];

export const PHASE_STATUSES = ["PLANEJADA", "EM_ANDAMENTO", "CONCLUIDA"] as const;
export type PhaseStatus = (typeof PHASE_STATUSES)[number];

export const PROJECT_STATUSES = ["ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "BLOCKED"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const ENTITY_TYPES = ["ROADMAP_ITEM", "PROJECT", "TASK"] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export const ACTIVITY_TYPES = [
  "COMMENT",
  "STATUS_CHANGE",
  "FIELD_UPDATE",
  "TASK_COMPLETED",
  "PHASE_UPDATE",
  "CREATED",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const STALL_SCOPES = ["GLOBAL", "TEAM"] as const;
export type StallScope = (typeof STALL_SCOPES)[number];

export const ROADMAP_STATUS_LABELS: Record<RoadmapStatus, string> = {
  PLANEJADO: "Planejado",
  EM_ANALISE: "Em análise",
  INICIADO: "Iniciado",
  PAUSADO: "Pausado",
  CANCELADO: "Cancelado",
  CONCLUIDO: "Concluído",
};

export const PHASE_STATUS_LABELS: Record<PhaseStatus, string> = {
  PLANEJADA: "Planejada",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  ACTIVE: "Ativo",
  ON_HOLD: "Em espera",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "A fazer",
  IN_PROGRESS: "Em andamento",
  IN_REVIEW: "Em revisão",
  DONE: "Concluída",
  BLOCKED: "Bloqueada",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};

export const HORIZON_LABELS: Record<Horizon, string> = {
  SHORT: "Curto prazo",
  MEDIUM: "Médio prazo",
  LONG: "Longo prazo",
};
