import { z } from "zod";

export const createProjectSchema = z.object({
  teamId: z.string().min(1, "Time é obrigatório"),
  title: z.string().min(2, "Título é obrigatório"),
  description: z.string().optional(),
  ownerId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  targetDate: z.coerce.date().optional(),
});

export const updateProjectSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  ownerId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  status: z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
  targetDate: z.coerce.date().nullable().optional(),
});

export const listProjectsQuerySchema = z.object({
  teamId: z.string().optional(),
  status: z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
  ownerId: z.string().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
