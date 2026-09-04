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
  // z.coerce.boolean() trataria a string "false" (não vazia) como true; comparamos o valor bruto.
  includeCompleted: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((value) => value === true || value === "true"),
});

export type CreateChecklistItemInput = z.infer<typeof createChecklistItemSchema>;
export type UpdateChecklistItemInput = z.infer<typeof updateChecklistItemSchema>;
