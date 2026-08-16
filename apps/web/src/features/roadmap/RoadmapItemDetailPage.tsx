import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HORIZON_LABELS, PHASE_STATUS_LABELS, PRIORITY_LABELS, ROADMAP_STATUS_LABELS } from "@myplanner/shared";
import type { PhaseStatus } from "@myplanner/shared";
import {
  useAddPhase,
  useDeletePhase,
  useDeleteRoadmapItem,
  usePromoteRoadmapItem,
  useRoadmapItem,
  useUpdatePhase,
} from "../../hooks/useRoadmap";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Field } from "../../components/ui/Field";
import { FullPageSpinner } from "../../components/ui/Spinner";
import { StallBadge } from "../../components/domain/StallBadge";
import { ActivityFeed } from "../../components/domain/ActivityFeed";
import { priorityTone, roadmapStatusTone } from "../../lib/badge-tones";
import { formatDate } from "../../lib/format";
import { getApiErrorMessage } from "../../lib/api";
import { RoadmapItemEditModal } from "./RoadmapItemEditModal";

export function RoadmapItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: item, isLoading } = useRoadmapItem(id);
  const promoteItem = usePromoteRoadmapItem();
  const deleteItem = useDeleteRoadmapItem();
  const addPhase = useAddPhase(id ?? "");
  const updatePhase = useUpdatePhase(id ?? "");
  const deletePhase = useDeletePhase(id ?? "");

  const [editOpen, setEditOpen] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (isLoading || !item) return <FullPageSpinner />;

  async function handlePromote() {
    if (!id) return;
    setError(null);
    try {
      const project = await promoteItem.mutateAsync(id);
      navigate(`/projects/${project.id}`);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function handleDelete() {
    if (!id) return;
    if (!confirm("Excluir este item de roadmap? Essa ação não pode ser desfeita.")) return;
    await deleteItem.mutateAsync(id);
    navigate("/roadmap");
  }

  async function handleAddPhase(event: FormEvent) {
    event.preventDefault();
    if (!newPhaseName.trim()) return;
    await addPhase.mutateAsync({ name: newPhaseName.trim() });
    setNewPhaseName("");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{item.title}</h1>
            <Badge tone={roadmapStatusTone[item.status]}>{ROADMAP_STATUS_LABELS[item.status]}</Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {item.team.name} · Responsável: {item.owner.name} · {HORIZON_LABELS[item.horizon]}
            {item.targetDate && ` · alvo: ${formatDate(item.targetDate)}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
            Editar
          </Button>
          {!item.project && (
            <Button size="sm" onClick={handlePromote} disabled={promoteItem.isPending}>
              {promoteItem.isPending ? "Convertendo..." : "Converter em projeto"}
            </Button>
          )}
          {item.project && (
            <Button size="sm" variant="secondary" onClick={() => navigate(`/projects/${item.project?.id}`)}>
              Ver projeto em execução
            </Button>
          )}
          <Button variant="danger" size="sm" onClick={handleDelete} disabled={!!item.project}>
            Excluir
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={priorityTone[item.priority]}>{PRIORITY_LABELS[item.priority]}</Badge>
        {item.targetQuarter && <Badge tone="slate">{item.targetQuarter}</Badge>}
        <StallBadge stall={item.stall} />
      </div>

      {item.description && (
        <Card className="p-4">
          <p className="text-sm text-slate-700 dark:text-slate-300">{item.description}</p>
        </Card>
      )}

      <section>
        <h2 className="mb-3 font-medium text-slate-900 dark:text-slate-100">Fases</h2>
        <Card className="divide-y divide-slate-200 dark:divide-slate-800">
          {item.phases.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
              Este item ainda não tem fases cadastradas.
            </p>
          ) : (
            item.phases.map((phase) => (
              <div key={phase.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{phase.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {phase.estimatedStartDate ? formatDate(phase.estimatedStartDate) : "sem início"} —{" "}
                    {phase.estimatedEndDate ? formatDate(phase.estimatedEndDate) : "sem fim"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={phase.status}
                    onChange={(e) =>
                      updatePhase.mutate({ phaseId: phase.id, status: e.target.value as PhaseStatus })
                    }
                    className="w-44"
                  >
                    {Object.entries(PHASE_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deletePhase.mutate(phase.id)}
                    disabled={deletePhase.isPending}
                  >
                    Remover
                  </Button>
                </div>
              </div>
            ))
          )}
          <form onSubmit={handleAddPhase} className="flex items-end gap-2 px-4 py-3">
            <div className="flex-1">
              <Field label="Nova fase">
                <Input
                  value={newPhaseName}
                  onChange={(e) => setNewPhaseName(e.target.value)}
                  placeholder="Ex: Fase 4 — Otimização"
                />
              </Field>
            </div>
            <Button type="submit" size="sm" variant="secondary" disabled={addPhase.isPending}>
              Adicionar
            </Button>
          </form>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 font-medium text-slate-900 dark:text-slate-100">Atividade</h2>
        {id && <ActivityFeed entityType="ROADMAP_ITEM" entityId={id} />}
      </section>

      <RoadmapItemEditModal item={item} open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
}
