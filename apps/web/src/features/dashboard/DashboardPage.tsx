import { useState } from "react";
import { Link } from "react-router-dom";
import { HORIZON_LABELS } from "@mapa-expansao/shared";
import { useDashboard } from "../../hooks/useDashboard";
import { useTeams } from "../../hooks/useTeams";
import { Card } from "../../components/ui/Card";
import { Select } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { FullPageSpinner } from "../../components/ui/Spinner";
import { ProjectCard } from "../../components/domain/ProjectCard";
import { RoadmapItemCard } from "../../components/domain/RoadmapItemCard";
import { formatDate } from "../../lib/format";

export function DashboardPage() {
  const [teamId, setTeamId] = useState<string>("");
  const { data: teams } = useTeams();
  const { data, isLoading } = useDashboard(teamId ? { teamId } : {});

  if (isLoading || !data) return <FullPageSpinner />;

  const horizonOrder: Array<keyof typeof data.roadmapByHorizon> = ["SHORT", "MEDIUM", "LONG"];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Visão consolidada dos seus times</p>
        </div>
        <Select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="w-56">
          <option value="">Todos os times</option>
          {teams?.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </Select>
      </div>

      {data.stalledItems.length > 0 && (
        <Card className="border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
          <h2 className="mb-3 flex items-center gap-2 font-medium text-red-800 dark:text-red-300">
            ⚠️ {data.stalledItems.length} item(ns) parado(s)
          </h2>
          <ul className="space-y-2">
            {data.stalledItems.map((item) => (
              <li key={`${item.type}-${item.id}`} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <Link
                  to={item.type === "ROADMAP_ITEM" ? `/roadmap/${item.id}` : `/projects/${item.id}`}
                  className="font-medium text-red-900 hover:underline dark:text-red-200"
                >
                  {item.title}
                </Link>
                <span className="text-red-700 dark:text-red-400">
                  sem atualização há {item.daysSinceLastActivity}d (tolerância: {item.toleranceDays}d)
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium text-slate-900 dark:text-slate-100">Projetos ativos</h2>
          <Link to="/projects" className="text-sm text-brand-600 hover:underline dark:text-brand-400">
            Ver todos
          </Link>
        </div>
        {data.activeProjects.length === 0 ? (
          <EmptyState title="Nenhum projeto ativo" description="Crie um projeto ou promova um item do roadmap." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.activeProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium text-slate-900 dark:text-slate-100">Roadmap por horizonte</h2>
          <Link to="/roadmap" className="text-sm text-brand-600 hover:underline dark:text-brand-400">
            Ver linha do tempo
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {horizonOrder.map((horizon) => (
            <div key={horizon}>
              <div className="mb-2 flex items-center gap-2">
                <Badge tone="slate">{HORIZON_LABELS[horizon]}</Badge>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {data.roadmapByHorizon[horizon].length} item(ns)
                </span>
              </div>
              <div className="space-y-3">
                {data.roadmapByHorizon[horizon].length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500">Nenhum item</p>
                ) : (
                  data.roadmapByHorizon[horizon].map((item) => <RoadmapItemCard key={item.id} item={item} />)
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-medium text-slate-900 dark:text-slate-100">Tarefas atrasadas</h2>
        {data.overdueTasks.length === 0 ? (
          <EmptyState title="Nenhuma tarefa atrasada" description="Tudo em dia por aqui." />
        ) : (
          <Card className="divide-y divide-slate-200 dark:divide-slate-800">
            {data.overdueTasks.map((task) => (
              <Link
                key={task.id}
                to={`/projects/${task.project?.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-100">{task.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {task.project?.title} · {task.assignee?.name ?? "sem responsável"}
                  </p>
                </div>
                <Badge tone="red">venceu em {formatDate(task.dueDate)}</Badge>
              </Link>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}
