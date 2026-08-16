import { useState, type FormEvent } from "react";
import type { Horizon, Priority, RoadmapStatus } from "@myplanner/shared";
import { HORIZON_LABELS, PRIORITY_LABELS, ROADMAP_STATUS_LABELS } from "@myplanner/shared";
import { Modal } from "../../components/ui/Modal";
import { Field } from "../../components/ui/Field";
import { Input, Select, Textarea } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useUsers } from "../../hooks/useUsers";
import { useUpdateRoadmapItem } from "../../hooks/useRoadmap";
import { getApiErrorMessage } from "../../lib/api";
import type { RoadmapItem } from "../../types/api";

interface RoadmapItemEditModalProps {
  item: RoadmapItem;
  open: boolean;
  onClose: () => void;
}

export function RoadmapItemEditModal({ item, open, onClose }: RoadmapItemEditModalProps) {
  const { data: users } = useUsers();
  const updateItem = useUpdateRoadmapItem(item.id);

  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? "");
  const [horizon, setHorizon] = useState<Horizon>(item.horizon);
  const [priority, setPriority] = useState<Priority>(item.priority);
  const [status, setStatus] = useState<RoadmapStatus>(item.status);
  const [targetDate, setTargetDate] = useState(item.targetDate ? item.targetDate.slice(0, 10) : "");
  const [targetQuarter, setTargetQuarter] = useState(item.targetQuarter ?? "");
  const [ownerId, setOwnerId] = useState(item.ownerId);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await updateItem.mutateAsync({
        title,
        description: description || undefined,
        horizon,
        priority,
        status,
        targetDate: targetDate || null,
        targetQuarter: targetQuarter || null,
        ownerId,
      });
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar item de roadmap" widthClassName="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Título" required>
          <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Descrição">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
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
        <Field label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value as RoadmapStatus)}>
            {Object.entries(ROADMAP_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Data alvo">
            <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </Field>
          <Field label="Trimestre (opcional)">
            <Input value={targetQuarter} onChange={(e) => setTargetQuarter(e.target.value)} />
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

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={updateItem.isPending}>
            {updateItem.isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
