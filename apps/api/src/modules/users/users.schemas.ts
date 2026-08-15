import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  theme: z.enum(["LIGHT", "DARK", "SYSTEM"]).optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export const updateNotificationPrefsSchema = z.object({
  stallAlertsEmail: z.boolean().optional(),
  weeklySummaryEmail: z.boolean().optional(),
});

export const updateDashboardTeamsSchema = z.object({
  teamIds: z.array(z.string()),
});

export const updateGlobalRoleSchema = z.object({
  globalRole: z.enum(["ADMIN", "MEMBER"]),
});
