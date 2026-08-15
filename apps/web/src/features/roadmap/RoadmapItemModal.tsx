import { useState, type FormEvent } from "react";
import type { Horizon, Priority } from "@mapa-expansao/shared";
import { HORIZON_LABELS, PRIORITY_LABELS } from "@mapa-expansao/shared";
import { Modal } from "../../components/ui/Modal";
import { Field } from "../../components/ui/Field";
import { Input, Select, Textarea } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useTeams } from "../../hooks/useTeams";
import { useUsers } from "../../hooks/useUsers";
import { useCreateRoadmapItem, type RoadmapPhaseInput } from "../../hooks/useRoadmap";
import { useAuth } from "../../stores/auth-store";
import { getApiErrorMessage } from "../../lib/api";

interface RoadmapItemModalProps {
  open: boolean;
  onClose: () => void;
  defaultTeamId?: string;
}

const emptyPhase: RoadmapPhaseInput = { name: "", estimatedStartDate: "", estimatedEndDate: "" };

export function RoadmapItemModal({ open, onClose, defaultTeamId }: RoadmapItemModalProps) {
  const { user } = useAuth();
  const { data: teams } = useTeams();
  const { data: users } = useUsers();
  const createRoadmapItem = useCreateRoadmapItem();

  const [title, setTitle] = useState("");
  const [teamId, setTeamId] = useState(defaultTeamId ?? "");
  const [description, setDescription] = useState("");
  const [horizon, setHorizon] = useState<Horizon>("MEDIUM");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [targetDate, setTargetDate] = useState("");
  const [targetQuarter, setTargetQuarter] = useState("");
  const [ownerId, setOwnerId] = useState(user?.id ?? "");
  const [hasPhases, setHasPhases] = useState<"NAO" | "SIM">("NAO");
  const [phases, setPhases] = useState<RoadmapPhaseInput[]>([{ ...emptyPhase }]);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setTitle("");
    setDescription("");
    setHorizon("MEDIUM");
    setPriority("MEDIUM");
    setTargetDate("");
    setTargetQuarter("");
    setOwnerId(user?.id ?? "");
    setHasPhases("NAO");
    setPhases([{ ...emptyPhase }]);
    setError(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function updatePhase(index: number, patch: Partial<RoadmapPhaseInput>) {
    setPhases((prev) => prev.map((phase, i) => (i === index ? { ...phase, ...patch } : phase)));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!teamId) {
      setError("Selecione um time");
      return;
    }

    try {
      await createRoadmapItem.mutateAsync({
        title,
        teamId,
        description: description || undefined,
        horizon,
        priority,
        targetDate: targetDate || undefined,
        targetQuarter: targetQuarter || undefined,
        ownerId: ownerId || undefined,
        hasPhases: hasPhases === "SIM",
        phases:
          hasPhases === "SIM"
            ? phases
                .filter((phase) => phase.name.trim().length > 0)
                .map((phase) => ({
                  name: phase.name,
                  estimatedStartDate: phase.estimatedStartDate || undefined,
                  estimatedEndDate: phase.estimatedEndDate || undefined,
                }))
            : undefined,
      });
      handleClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Novo item de roadmap" widthClassName="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Título" required>
          <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Expansão para novos mercados" autoFocus />
        </Field>

        <Field label="Time" required>
          <Select required value={teamId} onChange={(e) => setTeamId(e.target.value)}>
            <option value="">Selecione...</option>
            {teams?.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Descrição">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcional — detalhe depois se preferir" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Horizonte">
            <Select value={horizon} onChange={(e) => setHorizon(e.target.value as Horizon)}>
              {Object.entries(HORIZON_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Prioridade">
            <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Data alvo" hint="Ou use trimestre/ano abaixo">
            <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </Field>
          <Field label="Trimestre (opcional)">
            <Input value={targetQuarter} onChange={(e) => setTargetQuarter(e.target.value)} placeholder="Ex: Q3 2027" />
          </Field>
        </div>

        <Field label="Responsável">
          <Select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
            {users?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
          <Field label="Esse item de longo prazo possui fases? (ex: Fase 1 - Descoberta, Fase 2 - Construção, Fase 3 - Lançamento)">
            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-1.5 text-sm">
                <input type="radio" checked={hasPhases === "NAO"} onChange={() => setHasPhases("NAO")} /> Não
              </label>
              <label className="flex items-center gap-1.5 text-sm">
                <input type="radio" checked={hasPhases === "SIM"} onChange={() => setHasPhases("SIM")} /> Sim
              </label>
            </div>
          </Field>

          {hasPhases === "SIM" && (
            <div className="mt-3 space-y-3">
              {phases.map((phase, index) => (
                <div key={index} className="grid grid-cols-[1fr_auto_auto_auto] items-end gap-2">
                  <Field label={`Fase ${index + 1}`}>
                    <Input
                      value={phase.name}
                      onChange={(e) => updatePhase(index, { name: e.target.value })}
                      placeholder="Ex: Descoberta"
                    />
                  </Field>
                  <Field label="Início">
                    <Input
                      type="date"
                      value={phase.estimatedStartDate}
                      onChange={(e) => updatePhase(index, { estimatedStartDate: e.target.value })}
                    />
                  </Field>
                  <Field label="Fim">
                    <Input
                      type="date"
                      value={phase.estimatedEndDate}
                      onChange={(e) => updatePhase(index, { estimatedEndDate: e.target.value })}
                    />
                  </Field>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPhases((prev) => prev.filter((_, i) => i !== index))}
                    disabled={phases.length === 1}
                  >
                    Remover
                  </Button>
                </div>
              ))}
              <Button type="button" variant="secondary" size="sm" onClick={() => setPhases((prev) => [...prev, { ...emptyPhase }])}>
                + Adicionar fase
              </Button>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createRoadmapItem.isPending}>
            {createRoadmapItem.isPending ? "Criando..." : "Criar item"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
