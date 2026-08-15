import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { authGuard } from "../../middleware/auth";
import * as roadmapService from "./roadmap.service";
import {
  createPhaseSchema,
  createRoadmapItemSchema,
  listRoadmapItemsQuerySchema,
  updatePhaseSchema,
  updateRoadmapItemSchema,
} from "./roadmap.schemas";

export const roadmapRouter = Router();
roadmapRouter.use(authGuard);

roadmapRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const filters = listRoadmapItemsQuerySchema.parse(req.query);
    res.json(await roadmapService.listRoadmapItems(req.user!, filters));
  }),
);

roadmapRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(await roadmapService.getRoadmapItem(req.user!, req.params.id));
  }),
);

roadmapRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = createRoadmapItemSchema.parse(req.body);
    res.status(201).json(await roadmapService.createRoadmapItem(req.user!, input));
  }),
);

roadmapRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const input = updateRoadmapItemSchema.parse(req.body);
    res.json(await roadmapService.updateRoadmapItem(req.user!, req.params.id, input));
  }),
);

roadmapRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await roadmapService.deleteRoadmapItem(req.user!, req.params.id);
    res.status(204).send();
  }),
);

roadmapRouter.post(
  "/:id/promote",
  asyncHandler(async (req, res) => {
    const project = await roadmapService.promoteToProject(req.user!, req.params.id);
    res.status(201).json(project);
  }),
);

roadmapRouter.post(
  "/:id/phases",
  asyncHandler(async (req, res) => {
    const input = createPhaseSchema.parse(req.body);
    res.status(201).json(await roadmapService.addPhase(req.user!, req.params.id, input));
  }),
);

roadmapRouter.patch(
  "/:id/phases/:phaseId",
  asyncHandler(async (req, res) => {
    const input = updatePhaseSchema.parse(req.body);
    res.json(await roadmapService.updatePhase(req.user!, req.params.id, req.params.phaseId, input));
  }),
);

roadmapRouter.delete(
  "/:id/phases/:phaseId",
  asyncHandler(async (req, res) => {
    await roadmapService.deletePhase(req.user!, req.params.id, req.params.phaseId);
    res.status(204).send();
  }),
);
