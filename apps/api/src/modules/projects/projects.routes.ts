import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { authGuard } from "../../middleware/auth";
import * as projectsService from "./projects.service";
import { createProjectSchema, listProjectsQuerySchema, updateProjectSchema } from "./projects.schemas";

export const projectsRouter = Router();
projectsRouter.use(authGuard);

projectsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const filters = listProjectsQuerySchema.parse(req.query);
    res.json(await projectsService.listProjects(req.user!, filters));
  }),
);

projectsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(await projectsService.getProject(req.user!, req.params.id));
  }),
);

projectsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = createProjectSchema.parse(req.body);
    res.status(201).json(await projectsService.createProject(req.user!, input));
  }),
);

projectsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const input = updateProjectSchema.parse(req.body);
    res.json(await projectsService.updateProject(req.user!, req.params.id, input));
  }),
);

projectsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await projectsService.deleteProject(req.user!, req.params.id);
    res.status(204).send();
  }),
);

projectsRouter.post(
  "/:id/archive",
  asyncHandler(async (req, res) => {
    res.json(await projectsService.archiveProject(req.user!, req.params.id));
  }),
);

projectsRouter.post(
  "/:id/unarchive",
  asyncHandler(async (req, res) => {
    res.json(await projectsService.unarchiveProject(req.user!, req.params.id));
  }),
);
