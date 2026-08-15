import { z } from "zod";

export const entityTypeParamSchema = z.enum(["ROADMAP_ITEM", "PROJECT", "TASK"]);

export const addCommentSchema = z.object({
  body: z.string().min(1, "Comentário não pode ser vazio"),
});
