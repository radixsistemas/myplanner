import { useState } from "react";
import { PROJECT_STATUS_LABELS } from "@myplanner/shared";
import type { ProjectStatus } from "@myplanner/shared";
import { useProjects } from "../../hooks/useProjects";
import { useTeams } from "../../hooks/useTeams";
import { Select } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { FullPageSpinner } from "../../components/ui/Spinner";
import { ProjectCard } from "../../components/domain/ProjectCard";
import { ProjectModal } from "./ProjectModal";

export function ProjectsPage() {
  const [teamId, setTeamId] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "">("");
  const [modalOpen, setModalOpen] = useState(false);

  const { data: teams } = useTeams();
  const { data: projects, isLoading } = useProjects({
    teamId: teamId || undefined,
    status: status || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Projetos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Execução do dia a dia</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="w-44">
            <option value="">Todos os times</option>
            {teams?.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus | "")} className="w-44">
            <option value="">Todos os status</option>
            {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Button onClick={() => setModalOpen(true)}>+ Novo projeto</Button>
        </div>
      </div>

      {isLoading || !projects ? (
        <FullPageSpinner />
      ) : projects.length === 0 ? (
        <EmptyState
          title="Nenhum projeto"
          description="Crie um projeto do zero ou converta um item de roadmap."
          action={<Button onClick={() => setModalOpen(true)}>+ Novo projeto</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <ProjectModal open={modalOpen} onClose={() => setModalOpen(false)} defaultTeamId={teamId || undefined} />
    </div>
  );
}
