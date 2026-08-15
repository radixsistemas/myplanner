import { z } from "zod";

export const createPhaseSchema = z.object({
  name: z.string().min(1, "Nome da fase é obrigatório"),
  description: z.string().optional(),
  order: z.number().int().optional(),
  estimatedStartDate: z.coerce.date().optional(),
  estimatedEndDate: z.coerce.date().optional(),
});

export const updatePhaseSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  order: z.number().int().optional(),
  estimatedStartDate: z.coerce.date().nullable().optional(),
  estimatedEndDate: z.coerce.date().nullable().optional(),
  status: z.enum(["PLANEJADA", "EM_ANDAMENTO", "CONCLUIDA"]).optional(),
});

// Cadastro rápido: só título e time são obrigatórios; o resto pode ser detalhado depois.
export const createRoadmapItemSchema = z.object({
  teamId: z.string().min(1, "Time é obrigatório"),
  title: z.string().min(2, "Título é obrigatório"),
  description: z.string().optional(),
  horizon: z.enum(["SHORT", "MEDIUM", "LONG"]).default("MEDIUM"),
  targetDate: z.coerce.date().optional(),
  targetQuarter: z.string().optional(),
  targetYear: z.number().int().optional(),
  ownerId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  hasPhases: z.boolean().default(false),
  phases: z.array(createPhaseSchema).optional(),
});

export const updateRoadmapItemSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  horizon: z.enum(["SHORT", "MEDIUM", "LONG"]).optional(),
  targetDate: z.coerce.date().nullable().optional(),
  targetQuarter: z.string().nullable().optional(),
  targetYear: z.number().int().nullable().optional(),
  ownerId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  status: z.enum(["PLANEJADO", "EM_ANALISE", "INICIADO", "PAUSADO", "CANCELADO", "CONCLUIDO"]).optional(),
  hasPhases: z.boolean().optional(),
});

export const listRoadmapItemsQuerySchema = z.object({
  teamId: z.string().optional(),
  horizon: z.enum(["SHORT", "MEDIUM", "LONG"]).optional(),
  status: z.enum(["PLANEJADO", "EM_ANALISE", "INICIADO", "PAUSADO", "CANCELADO", "CONCLUIDO"]).optional(),
  ownerId: z.string().optional(),
});

export type CreateRoadmapItemInput = z.infer<typeof createRoadmapItemSchema>;
export type UpdateRoadmapItemInput = z.infer<typeof updateRoadmapItemSchema>;
export type CreatePhaseInput = z.infer<typeof createPhaseSchema>;
export type UpdatePhaseInput = z.infer<typeof updatePhaseSchema>;
