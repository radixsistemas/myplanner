import { useState } from "react";
import { useAuth } from "../../stores/auth-store";
import { useTeams } from "../../hooks/useTeams";
import { useUpdateDashboardTeams } from "../../hooks/useUsers";
import { Button } from "../../components/ui/Button";

export function DashboardTeamsTab() {
  const { user, refreshUser } = useAuth();
  const { data: teams } = useTeams();
  const updateDashboardTeams = useUpdateDashboardTeams();
  const [selected, setSelected] = useState<Set<string>>(new Set(user?.dashboardTeams.map((d) => d.teamId) ?? []));
  const [message, setMessage] = useState<string | null>(null);

  function toggle(teamId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  }

  async function handleSave() {
    await updateDashboardTeams.mutateAsync(Array.from(selected));
    await refreshUser();
    setMessage("Preferências salvas.");
  }

  return (
    <div className="max-w-md space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Escolha quais times aparecem no seu dashboard. Se nenhum for selecionado, todos os seus times aparecem por
        padrão.
      </p>
      <div className="space-y-2">
        {teams?.map((team) => (
          <label key={team.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={selected.has(team.id)} onChange={() => toggle(team.id)} />
            {team.name}
          </label>
        ))}
      </div>
      {message && <p className="text-sm text-green-600 dark:text-green-400">{message}</p>}
      <Button onClick={handleSave} disabled={updateDashboardTeams.isPending}>
        {updateDashboardTeams.isPending ? "Salvando..." : "Salvar"}
      </Button>
    </div>
  );
}
