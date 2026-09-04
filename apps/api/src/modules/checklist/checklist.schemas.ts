import { z } from "zod";

export const createChecklistItemSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
});

export const updateChecklistItemSchema = z
  .object({
    title: z.string().min(1).optional(),
    completed: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "Nenhum campo para atualizar" });

export const listChecklistItemsQuerySchema = z.object({
  includeCompleted: z.coerce.boolean().optional().default(false),
});

export type CreateChecklistItemInput = z.infer<typeof createChecklistItemSchema>;
export type UpdateChecklistItemInput = z.infer<typeof updateChecklistItemSchema>;
