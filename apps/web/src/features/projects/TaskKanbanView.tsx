import { useMemo } from "react";
import { PRIORITY_LABELS, TASK_STATUSES, TASK_STATUS_LABELS } from "@myplanner/shared";
import type { TaskStatus } from "@myplanner/shared";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Tooltip } from "../../components/ui/Tooltip";
import { priorityTone } from "../../lib/badge-tones";
import { useUpdateTask } from "../../hooks/useTasks";
import { formatDate } from "../../lib/format";
import type { Task } from "../../types/api";

interface TaskKanbanViewProps {
  tasks: Task[];
  projectId: string;
  onSelectTask: (task: Task) => void;
}

export function TaskKanbanView({ tasks, projectId, onSelectTask }: TaskKanbanViewProps) {
  const updateTask = useUpdateTask(projectId);

  const parentTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const task of tasks) map.set(task.id, task.title);
    return map;
  }, [tasks]);

  return (
    <div className="grid grid-cols-1 gap-4 overflow-x-auto pb-2 sm:grid-cols-3 lg:grid-cols-5">
      {TASK_STATUSES.map((status) => (
        <div key={status} className="min-w-[200px]">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">{TASK_STATUS_LABELS[status]}</h3>
            <span className="text-xs text-slate-400">{tasks.filter((t) => t.status === status).length}</span>
          </div>
          <div className="space-y-2">
            {tasks
              .filter((task) => task.status === status)
              .map((task) => {
                const isSubtask = Boolean(task.parentTaskId);
                const parentTitle = task.parentTaskId ? parentTitleById.get(task.parentTaskId) : undefined;

                return (
                  <Card
                    key={task.id}
                    className={
                      isSubtask
                        ? "cursor-pointer border-l-4 border-l-indigo-400 bg-indigo-50/60 p-3 dark:border-l-indigo-500 dark:bg-indigo-950/20"
                        : "cursor-pointer p-3"
                    }
                    onClick={() => onSelectTask(task)}
                  >
                    <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-800 dark:text-slate-100">
                      {isSubtask && (
                        <Tooltip label={`Subtarefa de: ${parentTitle ?? "tarefa não encontrada"}`}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="h-3.5 w-3.5 shrink-0 text-indigo-500 dark:text-indigo-400"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5 3a1 1 0 0 1 1 1v7a2 2 0 0 0 2 2h5.586l-1.293-1.293a1 1 0 1 1 1.414-1.414l3 3a1 1 0 0 1 0 1.414l-3 3a1 1 0 0 1-1.414-1.414L13.586 15H8a4 4 0 0 1-4-4V4a1 1 0 0 1 1-1Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </Tooltip>
                      )}
                      <span>{task.title}</span>
                    </p>
                    <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{task.assignee?.name ?? "sem responsável"}</span>
                      {task.dueDate && <span>{formatDate(task.dueDate)}</span>}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Badge tone={priorityTone[task.priority]}>{PRIORITY_LABELS[task.priority]}</Badge>
                      <select
                        value={task.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateTask.mutate({ id: task.id, status: e.target.value as TaskStatus });
                        }}
                        className="rounded border border-slate-200 bg-transparent text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300"
                      >
                        {TASK_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {TASK_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </Card>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
