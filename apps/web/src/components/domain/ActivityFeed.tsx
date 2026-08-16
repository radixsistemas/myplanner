import { useState, type FormEvent } from "react";
import type { EntityType } from "@myplanner/shared";
import { useActivity, useAddComment } from "../../hooks/useActivity";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Input";
import { formatRelative } from "../../lib/format";

const ACTIVITY_LABELS: Record<string, string> = {
  COMMENT: "comentou",
  STATUS_CHANGE: "mudou o status",
  FIELD_UPDATE: "atualizou campos",
  TASK_COMPLETED: "concluiu a tarefa",
  PHASE_UPDATE: "atualizou uma fase",
  CREATED: "criou",
};

export function ActivityFeed({ entityType, entityId }: { entityType: EntityType; entityId: string }) {
  const { data: entries, isLoading } = useActivity(entityType, entityId);
  const addComment = useAddComment(entityType, entityId);
  const [comment, setComment] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!comment.trim()) return;
    await addComment.mutateAsync(comment.trim());
    setComment("");
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Escreva um comentário..."
          className="min-h-[40px] flex-1"
        />
        <Button type="submit" size="sm" disabled={addComment.isPending || !comment.trim()}>
          Comentar
        </Button>
      </form>

      {isLoading ? (
        <p className="text-sm text-slate-400">Carregando...</p>
      ) : entries && entries.length > 0 ? (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
              <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>
                  <strong className="text-slate-700 dark:text-slate-200">{entry.user.name}</strong>{" "}
                  {ACTIVITY_LABELS[entry.type] ?? entry.type.toLowerCase()}
                </span>
                <span>{formatRelative(entry.createdAt)}</span>
              </div>
              {entry.body && <p className="text-slate-700 dark:text-slate-300">{entry.body}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-400 dark:text-slate-500">Nenhuma atividade ainda.</p>
      )}
    </div>
  );
}
