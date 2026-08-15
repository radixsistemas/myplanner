import { Badge } from "../ui/Badge";
import type { StallResult } from "../../types/api";

export function StallBadge({ stall }: { stall?: StallResult }) {
  if (!stall) return null;
  if (stall.isStalled) {
    return <Badge tone="red">⚠️ Parado há {stall.daysSinceLastActivity}d</Badge>;
  }
  if (stall.daysUntilStall <= 3) {
    return <Badge tone="amber">Alerta em {stall.daysUntilStall}d</Badge>;
  }
  return null;
}
