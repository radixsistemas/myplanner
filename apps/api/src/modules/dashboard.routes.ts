import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/async-handler";
import { authGuard } from "../middleware/auth";
import * as dashboardService from "./dashboard.service";

const dashboardQuerySchema = z.object({
  teamId: z.string().optional(),
  ownerId: z.string().optional(),
});

export const dashboardRouter = Router();
dashboardRouter.use(authGuard);

dashboardRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const filters = dashboardQuerySchema.parse(req.query);
    res.json(await dashboardService.getDashboard(req.user!, filters));
  }),
);
