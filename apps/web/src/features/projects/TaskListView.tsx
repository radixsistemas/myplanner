import { useState } from "react";
import { PRIORITY_LABELS, TASK_STATUS_LABELS } from "@mapa-expansao/shared";
import { Badge } from "../../components/ui/Badge";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { priorityTone, taskStatusTone } from "../../lib/badge-tones";
import { formatDate } from "../../lib/format";
import type { Task } from "../../types/api";

interface TaskListViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
}

export function TaskListView({ tasks, onSelectTask }: TaskListViewProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
      {tasks.map((task) => {
        const hasSubtasks = !!task.subtasks && task.subtasks.length > 0;
        return (
          <div key={task.id}>
            <div className="flex w-full items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
              {hasSubtasks ? (
                <button
                  type="button"
                  onClick={() => toggle(task.id)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {expanded.has(task.id) ? "▾" : "▸"}
                </button>
              ) : (
                <span className="w-3" />
              )}
              <button type="button" onClick={() => onSelectTask(task)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{task.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {task.assignee?.name ?? "sem responsável"}
                    {task.dueDate && ` · prazo ${formatDate(task.dueDate)}`}
                  </p>
                </div>
                <div className="hidden w-24 sm:block">
                  <ProgressBar value={task.progressPercent} />
                </div>
                <Badge tone={priorityTone[task.priority]}>{PRIORITY_LABELS[task.priority]}</Badge>
                <Badge tone={taskStatusTone[task.status]}>{TASK_STATUS_LABELS[task.status]}</Badge>
              </button>
            </div>
            {expanded.has(task.id) && hasSubtasks && (
              <div className="divide-y divide-slate-100 border-t border-slate-100 bg-slate-50/50 pl-9 dark:divide-slate-800/50 dark:border-slate-800/50 dark:bg-slate-950/30">
                {task.subtasks?.map((subtask) => (
                  <button
                    key={subtask.id}
                    type="button"
                    onClick={() => onSelectTask(subtask)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-slate-700 dark:text-slate-300">{subtask.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{subtask.assignee?.name ?? "sem responsável"}</p>
                    </div>
                    <Badge tone={taskStatusTone[subtask.status]}>{TASK_STATUS_LABELS[subtask.status]}</Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
