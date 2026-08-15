import { NavLink, Outlet } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "../../stores/auth-store";
import { useTheme } from "../../stores/theme-store";

const navItems = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/roadmap", label: "Roadmap", end: false },
  { to: "/projects", label: "Projetos", end: false },
  { to: "/settings", label: "Configurações", end: false },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const { resolvedTheme, setTheme, theme } = useTheme();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white px-4 py-6 dark:border-slate-800 dark:bg-slate-900 md:block">
        <div className="mb-8 px-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Mapa de Expansão</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Roadmap &amp; Projetos</p>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  "block rounded-md px-3 py-2 text-sm font-medium",
                  isActive
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-14 md:pb-0">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 md:px-6">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 md:hidden">Mapa de Expansão</div>
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === "DARK" ? "LIGHT" : "DARK")}
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              title={`Tema: ${theme}`}
            >
              {resolvedTheme === "DARK" ? "☀️" : "🌙"}
            </button>
            <div className="hidden text-right text-sm sm:block">
              <p className="font-medium text-slate-800 dark:text-slate-100">{user?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {user?.globalRole === "ADMIN" ? "Administrador" : "Membro"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Sair
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              clsx(
                "flex-1 px-2 py-3 text-center text-xs font-medium",
                isActive ? "text-brand-600 dark:text-brand-400" : "text-slate-500 dark:text-slate-400",
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
