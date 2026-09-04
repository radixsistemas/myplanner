import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PRIORITY_LABELS, PROJECT_STATUS_LABELS } from "@myplanner/shared";
import type { ProjectStatus } from "@myplanner/shared";
import {
  useArchiveProject,
  useDeleteProject,
  useProject,
  useUnarchiveProject,
  useUpdateProject,
} from "../../hooks/useProjects";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Input";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { FullPageSpinner } from "../../components/ui/Spinner";
import { StallBadge } from "../../components/domain/StallBadge";
import { ActivityFeed } from "../../components/domain/ActivityFeed";
import { priorityTone, projectStatusTone } from "../../lib/badge-tones";
import { formatDate } from "../../lib/format";
import { getApiErrorMessage } from "../../lib/api";
import { TaskListView } from "./TaskListView";
import { TaskKanbanView } from "./TaskKanbanView";
import { TaskModal } from "./TaskModal";
import type { Task } from "../../types/api";

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(id);
  const updateProject = useUpdateProject(id ?? "");
  const deleteProject = useDeleteProject();
  const archiveProject = useArchiveProject();
  const unarchiveProject = useUnarchiveProject();

  const [view, setView] = useState<"list" | "kanban">("list");
  const [taskModal, setTaskModal] = useState<{ task?: Task; parentTaskId?: string } | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  if (isLoading || !project) return <FullPageSpinner />;

  const topLevelTasks = project.tasks ?? [];
  const allTasksFlat = topLevelTasks.flatMap((task) => [task, ...(task.subtasks ?? [])]);

  async function handleDelete() {
    if (!id) return;
    if (!confirm("Excluir este projeto e todas as suas tarefas? Essa ação não pode ser desfeita.")) return;
    await deleteProject.mutateAsync(id);
    navigate("/projects");
  }

  async function handleToggleArchive() {
    if (!id || !project) return;
    setArchiveError(null);
    try {
      if (project.archivedAt) {
        await unarchiveProject.mutateAsync(id);
      } else {
        await archiveProject.mutateAsync(id);
      }
    } catch (err) {
      setArchiveError(getApiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{project.title}</h1>
            <Badge tone={projectStatusTone[project.status]}>{PROJECT_STATUS_LABELS[project.status]}</Badge>
            {project.archivedAt && <Badge tone="slate">Arquivado</Badge>}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {project.team.name} · Responsável: {project.owner.name}
            {project.targetDate && ` · prazo: ${formatDate(project.targetDate)}`}
            {project.roadmapItem && (
              <>
                {" · originado do roadmap: "}
                <button
                  type="button"
                  onClick={() => navigate(`/roadmap/${project.roadmapItem?.id}`)}
                  className="text-brand-600 hover:underline dark:text-brand-400"
                >
                  {project.roadmapItem.title}
                </button>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={project.status}
            onChange={(e) => updateProject.mutate({ status: e.target.value as ProjectStatus })}
            className="w-40"
          >
            {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleToggleArchive}
            disabled={archiveProject.isPending || unarchiveProject.isPending}
          >
            {project.archivedAt ? "Desarquivar" : "Arquivar"}
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            Excluir
          </Button>
        </div>
      </div>

      {archiveError && <p className="text-sm text-red-600 dark:text-red-400">{archiveError}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={priorityTone[project.priority]}>{PRIORITY_LABELS[project.priority]}</Badge>
        <StallBadge stall={project.stall} />
      </div>

      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Progresso geral</span>
          <span className="text-slate-500 dark:text-slate-400">{project.progressPercent}%</span>
        </div>
        <ProgressBar value={project.progressPercent} />
      </Card>

      {project.description && (
        <Card className="p-4">
          <p className="text-sm text-slate-700 dark:text-slate-300">{project.description}</p>
        </Card>
      )}

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-medium text-slate-900 dark:text-slate-100">Tarefas</h2>
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-slate-200 p-0.5 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setView("list")}
                className={`rounded px-3 py-1 text-xs font-medium ${view === "list" ? "bg-brand-600 text-white" : "text-slate-600 dark:text-slate-300"}`}
              >
                Lista
              </button>
              <button
                type="button"
                onClick={() => setView("kanban")}
                className={`rounded px-3 py-1 text-xs font-medium ${view === "kanban" ? "bg-brand-600 text-white" : "text-slate-600 dark:text-slate-300"}`}
              >
                Kanban
              </button>
            </div>
            <Button size="sm" onClick={() => setTaskModal({})}>
              + Nova tarefa
            </Button>
          </div>
        </div>

        {topLevelTasks.length === 0 ? (
          <Card className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">
            Nenhuma tarefa ainda. Crie a primeira para começar a acompanhar o progresso.
          </Card>
        ) : view === "list" ? (
          <TaskListView tasks={topLevelTasks} onSelectTask={(task) => setTaskModal({ task })} />
        ) : (
          <TaskKanbanView tasks={allTasksFlat} projectId={project.id} onSelectTask={(task) => setTaskModal({ task })} />
        )}
      </section>

      <section>
        <h2 className="mb-3 font-medium text-slate-900 dark:text-slate-100">Atividade do projeto</h2>
        {id && <ActivityFeed entityType="PROJECT" entityId={id} />}
      </section>

      {taskModal && (
        <TaskModal
          open
          onClose={() => setTaskModal(null)}
          projectId={project.id}
          task={taskModal.task}
          parentTaskId={taskModal.parentTaskId}
        />
      )}
    </div>
  );
}
