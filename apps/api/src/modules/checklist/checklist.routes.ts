import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { authGuard } from "../../middleware/auth";
import * as checklistService from "./checklist.service";
import {
  createChecklistItemSchema,
  listChecklistItemsQuerySchema,
  updateChecklistItemSchema,
} from "./checklist.schemas";

export const checklistRouter = Router();
checklistRouter.use(authGuard);

checklistRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { includeCompleted } = listChecklistItemsQuerySchema.parse(req.query);
    res.json(await checklistService.listChecklistItems(req.user!, includeCompleted));
  }),
);

checklistRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = createChecklistItemSchema.parse(req.body);
    res.status(201).json(await checklistService.createChecklistItem(req.user!, input));
  }),
);

checklistRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const input = updateChecklistItemSchema.parse(req.body);
    res.json(await checklistService.updateChecklistItem(req.user!, req.params.id, input));
  }),
);

checklistRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await checklistService.deleteChecklistItem(req.user!, req.params.id);
    res.status(204).send();
  }),
);
