import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { authGuard, requireAdmin } from "../../middleware/auth";
import * as stallRulesService from "./stall-rules.service";
import { stallRuleInputSchema } from "./stall-rules.schemas";

export const stallRulesRouter = Router();
stallRulesRouter.use(authGuard);

stallRulesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await stallRulesService.listRules(req.user!));
  }),
);

stallRulesRouter.put(
  "/global",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const input = stallRuleInputSchema.parse(req.body);
    res.json(await stallRulesService.updateGlobalRule(req.user!, input));
  }),
);

stallRulesRouter.put(
  "/teams/:teamId",
  asyncHandler(async (req, res) => {
    const input = stallRuleInputSchema.parse(req.body);
    res.json(await stallRulesService.upsertTeamRule(req.user!, req.params.teamId, input));
  }),
);

stallRulesRouter.delete(
  "/teams/:teamId",
  asyncHandler(async (req, res) => {
    await stallRulesService.deleteTeamRule(req.user!, req.params.teamId);
    res.status(204).send();
  }),
);
