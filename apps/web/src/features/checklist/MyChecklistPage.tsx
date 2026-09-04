import { useState } from "react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { EmptyState } from "../../components/ui/EmptyState";
import { Spinner } from "../../components/ui/Spinner";
import {
  useChecklistItems,
  useCreateChecklistItem,
  useDeleteChecklistItem,
  useUpdateChecklistItem,
} from "../../hooks/useChecklist";

export function MyChecklistPage() {
  const [showCompleted, setShowCompleted] = useState(false);
  const [title, setTitle] = useState("");
  const { data: items, isLoading } = useChecklistItems(showCompleted);
  const createItem = useCreateChecklistItem();
  const updateItem = useUpdateChecklistItem();
  const deleteItem = useDeleteChecklistItem();

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    createItem.mutate(trimmed);
    setTitle("");
  }

  function handleDelete(id: string) {
    if (!confirm("Excluir esta atividade do checklist?")) return;
    deleteItem.mutate(id);
  }

  const pendingItems = items?.filter((item) => !item.completed) ?? [];
  const completedItems = items?.filter((item) => item.completed) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Meu Checklist</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Uma lista de tarefas pessoal, separada dos seus projetos e tarefas.
        </p>
      </div>

      <Card className="border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300">
        Este checklist é de uso pessoal e individual: os itens aqui não afetam, e não são afetados por,
        nenhum projeto ou tarefa do MyPlanner. Apenas você vê e gerencia sua lista.
      </Card>

      <Card className="p-4">
        <form onSubmit={handleCreate} className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Adicionar nova atividade..."
            className="flex-1"
          />
          <Button type="submit" disabled={!title.trim() || createItem.isPending}>
            + Adicionar
          </Button>
        </form>
      </Card>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium text-slate-900 dark:text-slate-100">
            Pendentes {items && `(${pendingItems.length})`}
          </h2>
          <Button variant="secondary" size="sm" onClick={() => setShowCompleted((v) => !v)}>
            {showCompleted ? "Ocultar concluídas" : "Exibir concluídas"}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : pendingItems.length === 0 ? (
          <EmptyState
            title="Nenhuma atividade pendente"
            description="Adicione uma atividade acima para começar seu checklist pessoal."
          />
        ) : (
          <div className="space-y-2">
            {pendingItems.map((item) => (
              <Card key={item.id} className="flex items-center gap-3 p-3">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={(e) => updateItem.mutate({ id: item.id, completed: e.target.checked })}
                  className="h-4 w-4 shrink-0 accent-brand-600"
                />
                <span className="flex-1 text-sm text-slate-800 dark:text-slate-100">{item.title}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="text-xs text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  Excluir
                </button>
              </Card>
            ))}
          </div>
        )}
      </section>

      {showCompleted && (
        <section>
          <h2 className="mb-3 font-medium text-slate-900 dark:text-slate-100">
            Concluídas ({completedItems.length})
          </h2>
          {completedItems.length === 0 ? (
            <EmptyState title="Nenhuma atividade concluída ainda" />
          ) : (
            <div className="space-y-2">
              {completedItems.map((item) => (
                <Card key={item.id} className="flex items-center gap-3 p-3 opacity-60">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={(e) => updateItem.mutate({ id: item.id, completed: e.target.checked })}
                    className="h-4 w-4 shrink-0 accent-brand-600"
                  />
                  <span className="flex-1 text-sm text-slate-800 line-through dark:text-slate-100">
                    {item.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="text-xs text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    Excluir
                  </button>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
