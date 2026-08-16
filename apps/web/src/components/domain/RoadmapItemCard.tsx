import { Link } from "react-router-dom";
import { PRIORITY_LABELS, ROADMAP_STATUS_LABELS } from "@myplanner/shared";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { StallBadge } from "./StallBadge";
import { priorityTone, roadmapStatusTone } from "../../lib/badge-tones";
import { formatDate } from "../../lib/format";
import type { RoadmapItem } from "../../types/api";

export function RoadmapItemCard({ item }: { item: RoadmapItem }) {
  return (
    <Link to={`/roadmap/${item.id}`}>
      <Card className="p-4 transition hover:border-brand-300 dark:hover:border-brand-700">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-medium text-slate-900 dark:text-slate-100">{item.title}</h3>
          <Badge tone={roadmapStatusTone[item.status]}>{ROADMAP_STATUS_LABELS[item.status]}</Badge>
        </div>
        <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
          {item.team.name} · {item.owner.name}
          {item.targetDate && ` · alvo: ${formatDate(item.targetDate)}`}
          {item.targetQuarter && ` · ${item.targetQuarter}`}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={priorityTone[item.priority]}>{PRIORITY_LABELS[item.priority]}</Badge>
          {item.hasPhases && <Badge tone="purple">{item.phases.length} fase(s)</Badge>}
          {item.project && <Badge tone="green">Em execução</Badge>}
          <StallBadge stall={item.stall} />
        </div>
      </Card>
    </Link>
  );
}
