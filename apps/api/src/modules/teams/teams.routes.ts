import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { authGuard, requireAdmin } from "../../middleware/auth";
import * as teamsService from "./teams.service";
import { addMemberSchema, createTeamSchema, updateMemberRoleSchema, updateTeamSchema } from "./teams.schemas";

export const teamsRouter = Router();
teamsRouter.use(authGuard);

teamsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await teamsService.listTeams(req.user!));
  }),
);

teamsRouter.get(
  "/:teamId",
  asyncHandler(async (req, res) => {
    res.json(await teamsService.getTeam(req.user!, req.params.teamId));
  }),
);

teamsRouter.post(
  "/",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = createTeamSchema.parse(req.body);
    res.status(201).json(await teamsService.createTeam(data));
  }),
);

teamsRouter.patch(
  "/:teamId",
  asyncHandler(async (req, res) => {
    const data = updateTeamSchema.parse(req.body);
    res.json(await teamsService.updateTeam(req.user!, req.params.teamId, data));
  }),
);

teamsRouter.post(
  "/:teamId/members",
  asyncHandler(async (req, res) => {
    const data = addMemberSchema.parse(req.body);
    res.status(201).json(await teamsService.addMember(req.user!, req.params.teamId, data));
  }),
);

teamsRouter.patch(
  "/:teamId/members/:userId",
  asyncHandler(async (req, res) => {
    const { teamRole } = updateMemberRoleSchema.parse(req.body);
    res.json(await teamsService.updateMemberRole(req.user!, req.params.teamId, req.params.userId, teamRole));
  }),
);

teamsRouter.delete(
  "/:teamId/members/:userId",
  asyncHandler(async (req, res) => {
    await teamsService.removeMember(req.user!, req.params.teamId, req.params.userId);
    res.status(204).send();
  }),
);
