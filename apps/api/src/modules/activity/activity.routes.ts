import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { authGuard } from "../../middleware/auth";
import * as activityService from "./activity.service";
import { addCommentSchema, entityTypeParamSchema } from "./activity.schemas";

export const activityRouter = Router();
activityRouter.use(authGuard);

activityRouter.get(
  "/:entityType/:entityId",
  asyncHandler(async (req, res) => {
    const entityType = entityTypeParamSchema.parse(req.params.entityType);
    await activityService.assertEntityAccess(req.user!, entityType, req.params.entityId);
    res.json(await activityService.listActivity(entityType, req.params.entityId));
  }),
);

activityRouter.post(
  "/:entityType/:entityId/comments",
  asyncHandler(async (req, res) => {
    const entityType = entityTypeParamSchema.parse(req.params.entityType);
    const { body } = addCommentSchema.parse(req.body);
    await activityService.assertEntityAccess(req.user!, entityType, req.params.entityId);
    const comment = await activityService.addComment(entityType, req.params.entityId, req.user!.id, body);
    res.status(201).json(comment);
  }),
);
