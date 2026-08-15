import { useState } from "react";
import { HORIZON_LABELS, ROADMAP_STATUS_LABELS } from "@mapa-expansao/shared";
import type { Horizon, RoadmapStatus } from "@mapa-expansao/shared";
import { useRoadmapItems } from "../../hooks/useRoadmap";
import { useTeams } from "../../hooks/useTeams";
import { Select } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { FullPageSpinner } from "../../components/ui/Spinner";
import { RoadmapTimelineItem } from "../../components/domain/RoadmapTimelineItem";
import { RoadmapItemModal } from "./RoadmapItemModal";

const HORIZON_ORDER: Horizon[] = ["SHORT", "MEDIUM", "LONG"];

export function RoadmapPage() {
  const [teamId, setTeamId] = useState("");
  const [status, setStatus] = useState<RoadmapStatus | "">("");
  const [modalOpen, setModalOpen] = useState(false);

  const { data: teams } = useTeams();
  const { data: items, isLoading } = useRoadmapItems({
    teamId: teamId || undefined,
    status: status || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Roadmap</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Iniciativas futuras, agrupadas por horizonte</p>
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
          <Select value={status} onChange={(e) => setStatus(e.target.value as RoadmapStatus | "")} className="w-44">
            <option value="">Todos os status</option>
            {Object.entries(ROADMAP_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Button onClick={() => setModalOpen(true)}>+ Novo item</Button>
        </div>
      </div>

      {isLoading || !items ? (
        <FullPageSpinner />
      ) : items.length === 0 ? (
        <EmptyState
          title="Nenhum item de roadmap"
          description="Comece cadastrando a primeira grande iniciativa do time."
          action={<Button onClick={() => setModalOpen(true)}>+ Novo item</Button>}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {HORIZON_ORDER.map((horizon) => {
            const horizonItems = items
              .filter((item) => item.horizon === horizon)
              .sort((a, b) => (a.targetDate ?? "9999").localeCompare(b.targetDate ?? "9999"));
            return (
              <div key={horizon}>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-medium text-slate-900 dark:text-slate-100">{HORIZON_LABELS[horizon]}</h2>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{horizonItems.length} item(ns)</span>
                </div>
                <div className="space-y-3">
                  {horizonItems.length === 0 ? (
                    <p className="text-sm text-slate-400 dark:text-slate-500">Nenhum item</p>
                  ) : (
                    horizonItems.map((item) => <RoadmapTimelineItem key={item.id} item={item} />)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <RoadmapItemModal open={modalOpen} onClose={() => setModalOpen(false)} defaultTeamId={teamId || undefined} />
    </div>
  );
}
