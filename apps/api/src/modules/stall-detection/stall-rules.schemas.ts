import { z } from "zod";

export const stallRuleInputSchema = z
  .object({
    tolerancePercent: z.number().min(0.01).max(1),
    minToleranceDays: z.number().int().min(1),
    maxToleranceDays: z.number().int().min(1),
    reminderIntervalDays: z.number().int().min(1),
  })
  .refine((data) => data.minToleranceDays <= data.maxToleranceDays, {
    message: "minToleranceDays deve ser menor ou igual a maxToleranceDays",
    path: ["minToleranceDays"],
  });

export type StallRuleInput = z.infer<typeof stallRuleInputSchema>;
