import { z } from "zod";

export const createTeamSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
});

export const updateTeamSchema = createTeamSchema.partial();

export const addMemberSchema = z.object({
  userId: z.string().min(1),
  teamRole: z.enum(["MANAGER", "COLLABORATOR"]).default("COLLABORATOR"),
});

export const updateMemberRoleSchema = z.object({
  teamRole: z.enum(["MANAGER", "COLLABORATOR"]),
});
