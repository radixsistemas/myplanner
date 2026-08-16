import { useState, type FormEvent } from "react";
import type { Priority } from "@myplanner/shared";
import { PRIORITY_LABELS } from "@myplanner/shared";
import { Modal } from "../../components/ui/Modal";
import { Field } from "../../components/ui/Field";
import { Input, Select, Textarea } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useTeams } from "../../hooks/useTeams";
import { useUsers } from "../../hooks/useUsers";
import { useCreateProject } from "../../hooks/useProjects";
import { useAuth } from "../../stores/auth-store";
import { getApiErrorMessage } from "../../lib/api";

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  defaultTeamId?: string;
}

export function ProjectModal({ open, onClose, defaultTeamId }: ProjectModalProps) {
  const { user } = useAuth();
  const { data: teams } = useTeams();
  const { data: users } = useUsers();
  const createProject = useCreateProject();

  const [title, setTitle] = useState("");
  const [teamId, setTeamId] = useState(defaultTeamId ?? "");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [targetDate, setTargetDate] = useState("");
  const [ownerId, setOwnerId] = useState(user?.id ?? "");
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
    setTargetDate("");
    setOwnerId(user?.id ?? "");
    setError(null);
    onClose();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!teamId) {
      setError("Selecione um time");
      return;
    }
    try {
      await createProject.mutateAsync({
        title,
        teamId,
        description: description || undefined,
        priority,
        targetDate: targetDate || undefined,
        ownerId: ownerId || undefined,
      });
      handleClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Novo projeto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Título" required>
          <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Redesign do checkout" autoFocus />
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
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcional" />
        </Field>
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
          <Field label="Prazo (opcional)">
            <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
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
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createProject.isPending}>
            {createProject.isPending ? "Criando..." : "Criar projeto"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
