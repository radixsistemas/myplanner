import { Link } from "react-router-dom";
import { PRIORITY_LABELS, ROADMAP_STATUS_LABELS } from "@myplanner/shared";
import { Badge } from "../ui/Badge";
import { StallBadge } from "./StallBadge";
import { priorityTone, roadmapStatusTone } from "../../lib/badge-tones";
import { formatDate } from "../../lib/format";
import type { RoadmapItem } from "../../types/api";

export function RoadmapTimelineItem({ item }: { item: RoadmapItem }) {
  let percentElapsed: number | null = null;
  let overdue = false;

  if (item.targetDate) {
    const start = new Date(item.createdAt).getTime();
    const end = new Date(item.targetDate).getTime();
    const now = Date.now();
    const range = end - start;
    percentElapsed = range > 0 ? Math.min(100, Math.max(0, ((now - start) / range) * 100)) : 100;
    overdue = now > end && item.status !== "CONCLUIDO";
  }

  return (
    <Link
      to={`/roadmap/${item.id}`}
      className="block rounded-lg border border-slate-200 bg-white p-3 transition hover:border-brand-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700"
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <p className="font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
        <Badge tone={roadmapStatusTone[item.status]}>{ROADMAP_STATUS_LABELS[item.status]}</Badge>
      </div>
      <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
        {item.team.name} · {item.owner.name}
        {item.targetDate && ` · alvo ${formatDate(item.targetDate)}`}
        {item.targetQuarter && ` · ${item.targetQuarter}`}
      </p>
      {percentElapsed !== null && (
        <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className={`h-full rounded-full ${overdue ? "bg-red-500" : percentElapsed > 75 ? "bg-amber-500" : "bg-brand-500"}`}
            style={{ width: `${percentElapsed}%` }}
          />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={priorityTone[item.priority]}>{PRIORITY_LABELS[item.priority]}</Badge>
        {item.hasPhases && <Badge tone="purple">{item.phases.length} fase(s)</Badge>}
        {item.project && <Badge tone="green">Em execução</Badge>}
        <StallBadge stall={item.stall} />
      </div>
    </Link>
  );
}
