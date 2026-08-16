import { PRIORITY_LABELS, TASK_STATUSES, TASK_STATUS_LABELS } from "@myplanner/shared";
import type { TaskStatus } from "@myplanner/shared";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
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
              .map((task) => (
                <Card key={task.id} className="cursor-pointer p-3" onClick={() => onSelectTask(task)}>
                  <p className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-100">{task.title}</p>
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
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
