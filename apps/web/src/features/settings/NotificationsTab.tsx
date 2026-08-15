import { useState } from "react";
import { useAuth } from "../../stores/auth-store";
import { useUpdateNotificationPreferences } from "../../hooks/useUsers";
import { Button } from "../../components/ui/Button";

export function NotificationsTab() {
  const { user, refreshUser } = useAuth();
  const updatePrefs = useUpdateNotificationPreferences();
  const [stallAlerts, setStallAlerts] = useState(user?.notificationPreference?.stallAlertsEmail ?? true);
  const [weeklySummary, setWeeklySummary] = useState(user?.notificationPreference?.weeklySummaryEmail ?? true);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    await updatePrefs.mutateAsync({ stallAlertsEmail: stallAlerts, weeklySummaryEmail: weeklySummary });
    await refreshUser();
    setMessage("Preferências salvas.");
  }

  return (
    <div className="max-w-md space-y-4">
      <label className="flex items-start gap-3 rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
        <input
          type="checkbox"
          checked={stallAlerts}
          onChange={(e) => setStallAlerts(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          <span className="block font-medium text-slate-800 dark:text-slate-100">Alertas de estagnação</span>
          <span className="block text-slate-500 dark:text-slate-400">
            Receber e-mail quando um item de roadmap ou projeto seu ficar parado.
          </span>
        </span>
      </label>
      <label className="flex items-start gap-3 rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
        <input
          type="checkbox"
          checked={weeklySummary}
          onChange={(e) => setWeeklySummary(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          <span className="block font-medium text-slate-800 dark:text-slate-100">Resumo semanal</span>
          <span className="block text-slate-500 dark:text-slate-400">Receber um resumo por e-mail toda semana.</span>
        </span>
      </label>
      {message && <p className="text-sm text-green-600 dark:text-green-400">{message}</p>}
      <Button onClick={handleSave} disabled={updatePrefs.isPending}>
        {updatePrefs.isPending ? "Salvando..." : "Salvar"}
      </Button>
    </div>
  );
}
