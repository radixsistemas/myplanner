import { useState, type FormEvent } from "react";
import type { Priority, TaskStatus } from "@myplanner/shared";
import { PRIORITY_LABELS, TASK_STATUS_LABELS } from "@myplanner/shared";
import { Modal } from "../../components/ui/Modal";
import { Field } from "../../components/ui/Field";
import { Input, Select, Textarea } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { ActivityFeed } from "../../components/domain/ActivityFeed";
import { taskStatusTone } from "../../lib/badge-tones";
import { useUsers } from "../../hooks/useUsers";
import { useCreateTask, useDeleteTask, useUpdateTask } from "../../hooks/useTasks";
import { getApiErrorMessage } from "../../lib/api";
import type { Task } from "../../types/api";

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  task?: Task;
  parentTaskId?: string;
}

export function TaskModal({ open, onClose, projectId, task, parentTaskId }: TaskModalProps) {
  const { data: users } = useUsers();
  const createTask = useCreateTask(projectId);
  const updateTask = useUpdateTask(projectId);
  const deleteTask = useDeleteTask(projectId);

  const isEditing = !!task;

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId ?? "");
  const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.slice(0, 10) : "");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "MEDIUM");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "TODO");
  const [progressPercent, setProgressPercent] = useState(task?.progressPercent ?? 0);
  const [error, setError] = useState<string | null>(null);

  const [subtaskTitle, setSubtaskTitle] = useState("");
  const hasSubtasks = !!task && !task.parentTaskId;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      if (isEditing && task) {
        await updateTask.mutateAsync({
          id: task.id,
          title,
          description: description || undefined,
          assigneeId: assigneeId || null,
          dueDate: dueDate || null,
          priority,
          status,
          progressPercent,
        });
      } else {
        await createTask.mutateAsync({
          projectId,
          parentTaskId,
          title,
          description: description || undefined,
          assigneeId: assigneeId || undefined,
          dueDate: dueDate || undefined,
          priority,
        });
      }
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function handleDelete() {
    if (!task) return;
    if (!confirm("Excluir esta tarefa?")) return;
    await deleteTask.mutateAsync(task.id);
    onClose();
  }

  async function handleAddSubtask(event: FormEvent) {
    event.preventDefault();
    if (!subtaskTitle.trim() || !task) return;
    await createTask.mutateAsync({ projectId, parentTaskId: task.id, title: subtaskTitle.trim() });
    setSubtaskTitle("");
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Editar tarefa" : parentTaskId ? "Nova subtarefa" : "Nova tarefa"}
      widthClassName="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Título" required>
          <Input required value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </Field>
        <Field label="Descrição">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Responsável">
            <Select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
              <option value="">Sem responsável</option>
              {users?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Prazo">
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Prioridade">
            <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          {isEditing && (
            <Field label="Status">
              <Select
                value={status}
                onChange={(e) => {
                  const nextStatus = e.target.value as TaskStatus;
                  setStatus(nextStatus);
                  if (nextStatus === "DONE") setProgressPercent(100);
                }}
              >
                {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </div>
        {isEditing && (
          <Field label={`Progresso: ${progressPercent}%`}>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={progressPercent}
              onChange={(e) => setProgressPercent(Number(e.target.value))}
              className="w-full"
            />
            <ProgressBar value={progressPercent} className="mt-1" />
          </Field>
        )}

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex items-center justify-between gap-2 pt-2">
          <div>
            {isEditing && (
              <Button type="button" variant="danger" size="sm" onClick={handleDelete}>
                Excluir
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createTask.isPending || updateTask.isPending}>
              {isEditing ? "Salvar" : "Criar"}
            </Button>
          </div>
        </div>
      </form>

      {hasSubtasks && task && (
        <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
          <h3 className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-100">Subtarefas</h3>
          <ul className="mb-3 space-y-1.5">
            {(task.subtasks ?? []).map((subtask) => (
              <li key={subtask.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-slate-700 dark:text-slate-300">{subtask.title}</span>
                <Badge tone={taskStatusTone[subtask.status]}>{TASK_STATUS_LABELS[subtask.status]}</Badge>
              </li>
            ))}
            {(task.subtasks ?? []).length === 0 && (
              <li className="text-sm text-slate-400 dark:text-slate-500">Nenhuma subtarefa ainda.</li>
            )}
          </ul>
          <form onSubmit={handleAddSubtask} className="flex gap-2">
            <Input
              value={subtaskTitle}
              onChange={(e) => setSubtaskTitle(e.target.value)}
              placeholder="Nova subtarefa..."
              className="flex-1"
            />
            <Button type="submit" size="sm" variant="secondary">
              Adicionar
            </Button>
          </form>
        </div>
      )}

      {isEditing && task && (
        <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
          <h3 className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-100">Comentários</h3>
          <ActivityFeed entityType="TASK" entityId={task.id} />
        </div>
      )}
    </Modal>
  );
}
