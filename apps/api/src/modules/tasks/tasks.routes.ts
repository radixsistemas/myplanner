import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { authGuard } from "../../middleware/auth";
import * as tasksService from "./tasks.service";
import { createTaskSchema, listTasksQuerySchema, updateTaskSchema } from "./tasks.schemas";

export const tasksRouter = Router();
tasksRouter.use(authGuard);

tasksRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const filters = listTasksQuerySchema.parse(req.query);
    res.json(await tasksService.listTasks(req.user!, filters));
  }),
);

tasksRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(await tasksService.getTask(req.user!, req.params.id));
  }),
);

tasksRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = createTaskSchema.parse(req.body);
    res.status(201).json(await tasksService.createTask(req.user!, input));
  }),
);

tasksRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const input = updateTaskSchema.parse(req.body);
    res.json(await tasksService.updateTask(req.user!, req.params.id, input));
  }),
);

tasksRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await tasksService.deleteTask(req.user!, req.params.id);
    res.status(204).send();
  }),
);
