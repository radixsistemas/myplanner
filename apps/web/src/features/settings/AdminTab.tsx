import { useState, type FormEvent } from "react";
import type { GlobalRole, TeamRole } from "@mapa-expansao/shared";
import { useAddTeamMember, useCreateTeam, useRemoveTeamMember, useTeams, useUpdateTeamMemberRole } from "../../hooks/useTeams";
import { useUpdateUserRole, useUsers } from "../../hooks/useUsers";
import { useStallRules, useUpdateGlobalStallRule } from "../../hooks/useStallRules";
import { Card } from "../../components/ui/Card";
import { Field } from "../../components/ui/Field";
import { Input, Select } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import type { PublicUser, TeamMember } from "../../types/api";

export function AdminTab() {
  return (
    <div className="space-y-8">
      <StallRuleSection />
      <TeamsSection />
      <UsersSection />
    </div>
  );
}

function StallRuleSection() {
  const { data } = useStallRules();
  const updateRule = useUpdateGlobalStallRule();
  const [tolerancePercent, setTolerancePercent] = useState(15);
  const [minDays, setMinDays] = useState(7);
  const [maxDays, setMaxDays] = useState(45);
  const [reminderDays, setReminderDays] = useState(7);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (data && !loaded) {
    setTolerancePercent(Math.round(data.global.tolerancePercent * 100));
    setMinDays(data.global.minToleranceDays);
    setMaxDays(data.global.maxToleranceDays);
    setReminderDays(data.global.reminderIntervalDays);
    setLoaded(true);
  }

  if (!data) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    await updateRule.mutateAsync({
      tolerancePercent: tolerancePercent / 100,
      minToleranceDays: minDays,
      maxToleranceDays: maxDays,
      reminderIntervalDays: reminderDays,
    });
    setMessage("Regra global salva.");
  }

  return (
    <Card className="p-4">
      <h2 className="mb-1 font-medium text-slate-900 dark:text-slate-100">Regra global de estagnação</h2>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        Tolerância = % do prazo total do item sem atividade, limitada entre o mínimo e o máximo de dias. Times
        podem sobrescrever esta regra via API.
      </p>
      <form onSubmit={handleSubmit} className="grid max-w-lg grid-cols-2 gap-4">
        <Field label="Tolerância (% do prazo)">
          <Input
            type="number"
            min={1}
            max={100}
            value={tolerancePercent}
            onChange={(e) => setTolerancePercent(Number(e.target.value))}
          />
        </Field>
        <Field label="Reenvio de alerta (dias)">
          <Input type="number" min={1} value={reminderDays} onChange={(e) => setReminderDays(Number(e.target.value))} />
        </Field>
        <Field label="Tolerância mínima (dias)">
          <Input type="number" min={1} value={minDays} onChange={(e) => setMinDays(Number(e.target.value))} />
        </Field>
        <Field label="Tolerância máxima (dias)">
          <Input type="number" min={1} value={maxDays} onChange={(e) => setMaxDays(Number(e.target.value))} />
        </Field>
        <div className="col-span-2 flex items-center gap-3">
          <Button type="submit" size="sm" disabled={updateRule.isPending}>
            Salvar regra
          </Button>
          {message && <span className="text-sm text-green-600 dark:text-green-400">{message}</span>}
        </div>
      </form>
    </Card>
  );
}

function TeamsSection() {
  const { data: teams } = useTeams();
  const { data: users } = useUsers();
  const createTeam = useCreateTeam();
  const [newTeamName, setNewTeamName] = useState("");

  async function handleCreateTeam(event: FormEvent) {
    event.preventDefault();
    if (!newTeamName.trim()) return;
    await createTeam.mutateAsync({ name: newTeamName.trim() });
    setNewTeamName("");
  }

  return (
    <Card className="p-4">
      <h2 className="mb-4 font-medium text-slate-900 dark:text-slate-100">Times</h2>
      <form onSubmit={handleCreateTeam} className="mb-4 flex gap-2">
        <Input
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          placeholder="Nome do novo time"
          className="max-w-xs"
        />
        <Button type="submit" size="sm" variant="secondary" disabled={createTeam.isPending}>
          + Criar time
        </Button>
      </form>
      <div className="space-y-4">
        {teams?.map((team) => (
          <TeamMembersEditor key={team.id} teamId={team.id} teamName={team.name} members={team.members} allUsers={users ?? []} />
        ))}
      </div>
    </Card>
  );
}

function TeamMembersEditor({
  teamId,
  teamName,
  members,
  allUsers,
}: {
  teamId: string;
  teamName: string;
  members: TeamMember[];
  allUsers: PublicUser[];
}) {
  const addMember = useAddTeamMember(teamId);
  const updateRole = useUpdateTeamMemberRole(teamId);
  const removeMember = useRemoveTeamMember(teamId);
  const [selectedUserId, setSelectedUserId] = useState("");

  const availableUsers = allUsers.filter((u) => !members.some((m) => m.userId === u.id));

  return (
    <div className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
      <p className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-100">{teamName}</p>
      <ul className="mb-2 space-y-1.5">
        {members.map((member) => (
          <li key={member.userId} className="flex items-center justify-between gap-2 text-sm">
            <span className="text-slate-700 dark:text-slate-300">{member.user.name}</span>
            <div className="flex items-center gap-2">
              <Select
                value={member.teamRole}
                onChange={(e) => updateRole.mutate({ userId: member.userId, teamRole: e.target.value as TeamRole })}
                className="w-36 py-1 text-xs"
              >
                <option value="COLLABORATOR">Colaborador</option>
                <option value="MANAGER">Gestor</option>
              </Select>
              <Button variant="ghost" size="sm" onClick={() => removeMember.mutate(member.userId)}>
                Remover
              </Button>
            </div>
          </li>
        ))}
        {members.length === 0 && <li className="text-sm text-slate-400 dark:text-slate-500">Nenhum membro ainda.</li>}
      </ul>
      {availableUsers.length > 0 && (
        <div className="flex gap-2">
          <Select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="max-w-xs">
            <option value="">Adicionar membro...</option>
            {availableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
          <Button
            size="sm"
            variant="secondary"
            disabled={!selectedUserId || addMember.isPending}
            onClick={() => {
              addMember.mutate({ userId: selectedUserId, teamRole: "COLLABORATOR" });
              setSelectedUserId("");
            }}
          >
            Adicionar
          </Button>
        </div>
      )}
    </div>
  );
}

function UsersSection() {
  const { data: users } = useUsers();
  const updateRole = useUpdateUserRole();

  return (
    <Card className="p-4">
      <h2 className="mb-4 font-medium text-slate-900 dark:text-slate-100">Usuários</h2>
      <ul className="divide-y divide-slate-200 dark:divide-slate-800">
        {users?.map((u) => (
          <li key={u.id} className="flex items-center justify-between gap-2 py-2 text-sm">
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-100">{u.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={u.globalRole === "ADMIN" ? "purple" : "slate"}>
                {u.globalRole === "ADMIN" ? "Admin" : "Membro"}
              </Badge>
              <Select
                value={u.globalRole}
                onChange={(e) => updateRole.mutate({ userId: u.id, globalRole: e.target.value as GlobalRole })}
                className="w-32 py-1 text-xs"
              >
                <option value="MEMBER">Membro</option>
                <option value="ADMIN">Admin</option>
              </Select>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
