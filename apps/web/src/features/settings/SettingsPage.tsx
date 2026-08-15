import { useState } from "react";
import clsx from "clsx";
import { useAuth } from "../../stores/auth-store";
import { ProfileTab } from "./ProfileTab";
import { NotificationsTab } from "./NotificationsTab";
import { DashboardTeamsTab } from "./DashboardTeamsTab";
import { AdminTab } from "./AdminTab";

const TABS = ["Perfil", "Notificações", "Times no dashboard", "Administração"] as const;
type Tab = (typeof TABS)[number];

export function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.globalRole === "ADMIN";
  const [tab, setTab] = useState<Tab>("Perfil");

  const visibleTabs = TABS.filter((t) => t !== "Administração" || isAdmin);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Configurações</h1>
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {visibleTabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={clsx(
              "border-b-2 px-3 py-2 text-sm font-medium",
              tab === t
                ? "border-brand-600 text-brand-700 dark:text-brand-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Perfil" && <ProfileTab />}
      {tab === "Notificações" && <NotificationsTab />}
      {tab === "Times no dashboard" && <DashboardTeamsTab />}
      {tab === "Administração" && isAdmin && <AdminTab />}
    </div>
  );
}
