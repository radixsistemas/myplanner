import { z } from "zod";

export const createTaskSchema = z.object({
  projectId: z.string().min(1, "Projeto é obrigatório"),
  parentTaskId: z.string().optional(),
  title: z.string().min(2, "Título é obrigatório"),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
});

export const updateTaskSchema = z
  .object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "BLOCKED"]).optional(),
    assigneeId: z.string().nullable().optional(),
    dueDate: z.coerce.date().nullable().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
    progressPercent: z.number().int().min(0).max(100).optional(),
    position: z.number().int().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "Nenhum campo para atualizar" });

export const listTasksQuerySchema = z.object({
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "BLOCKED"]).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
