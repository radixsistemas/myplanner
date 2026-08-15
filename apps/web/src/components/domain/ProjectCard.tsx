import { Link } from "react-router-dom";
import { PRIORITY_LABELS, PROJECT_STATUS_LABELS } from "@mapa-expansao/shared";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { ProgressBar } from "../ui/ProgressBar";
import { StallBadge } from "./StallBadge";
import { priorityTone, projectStatusTone } from "../../lib/badge-tones";
import type { Project } from "../../types/api";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link to={`/projects/${project.id}`}>
      <Card className="p-4 transition hover:border-brand-300 dark:hover:border-brand-700">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-medium text-slate-900 dark:text-slate-100">{project.title}</h3>
          <Badge tone={projectStatusTone[project.status]}>{PROJECT_STATUS_LABELS[project.status]}</Badge>
        </div>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          {project.team.name} · {project.owner.name}
        </p>
        <ProgressBar value={project.progressPercent} className="mb-2" />
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>{project.progressPercent}% concluído</span>
          <div className="flex items-center gap-2">
            <Badge tone={priorityTone[project.priority]}>{PRIORITY_LABELS[project.priority]}</Badge>
            <StallBadge stall={project.stall} />
          </div>
        </div>
      </Card>
    </Link>
  );
}
