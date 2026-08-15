import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { authGuard, requireAdmin } from "../../middleware/auth";
import * as usersService from "./users.service";
import {
  updateDashboardTeamsSchema,
  updateGlobalRoleSchema,
  updateNotificationPrefsSchema,
  updateProfileSchema,
} from "./users.schemas";

export const usersRouter = Router();
usersRouter.use(authGuard);

usersRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await usersService.listUsers());
  }),
);

usersRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    res.json(await usersService.getUserProfile(req.user!.id));
  }),
);

usersRouter.patch(
  "/me",
  asyncHandler(async (req, res) => {
    const data = updateProfileSchema.parse(req.body);
    res.json(await usersService.updateProfile(req.user!.id, data));
  }),
);

usersRouter.patch(
  "/me/notification-preferences",
  asyncHandler(async (req, res) => {
    const data = updateNotificationPrefsSchema.parse(req.body);
    res.json(await usersService.updateNotificationPreferences(req.user!.id, data));
  }),
);

usersRouter.put(
  "/me/dashboard-teams",
  asyncHandler(async (req, res) => {
    const { teamIds } = updateDashboardTeamsSchema.parse(req.body);
    res.json(await usersService.updateDashboardTeams(req.user!.id, teamIds));
  }),
);

usersRouter.patch(
  "/:id/role",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { globalRole } = updateGlobalRoleSchema.parse(req.body);
    res.json(await usersService.updateGlobalRole(req.params.id, globalRole));
  }),
);
