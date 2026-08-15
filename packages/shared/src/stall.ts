export interface StallRuleParams {
  /** Fração da duração total do item sem atividade que dispara alerta. Ex: 0.15 = 15%. */
  tolerancePercent: number;
  minToleranceDays: number;
  maxToleranceDays: number;
}

export interface StallInput {
  /** Data em que o item começou a ser contado (createdAt do roadmap item, ou startedAt do projeto). */
  startDate: Date;
  /** Data alvo/prazo final estimado. Se ausente, usa maxToleranceDays como teto de duração assumida. */
  targetDate: Date | null;
  lastActivityAt: Date;
  now?: Date;
}

export interface StallResult {
  totalDurationDays: number;
  toleranceDays: number;
  daysSinceLastActivity: number;
  isStalled: boolean;
  /** Dias restantes até o item ser considerado parado (negativo se já estiver parado). */
  daysUntilStall: number;
}

/**
 * Calcula a tolerância de inatividade proporcional ao prazo do item, dentro dos
 * limites mín./máx. configurados. Sem prazo definido, assume a tolerância máxima
 * (item de longo prazo/indefinido tolera mais tempo sem atividade).
 */
export function computeStallStatus(input: StallInput, rule: StallRuleParams): StallResult {
  const now = input.now ?? new Date();
  const msPerDay = 1000 * 60 * 60 * 24;

  const totalDurationDays = input.targetDate
    ? Math.max(1, Math.round((input.targetDate.getTime() - input.startDate.getTime()) / msPerDay))
    : rule.maxToleranceDays / rule.tolerancePercent;

  const rawTolerance = totalDurationDays * rule.tolerancePercent;
  const toleranceDays = Math.min(rule.maxToleranceDays, Math.max(rule.minToleranceDays, Math.round(rawTolerance)));

  const daysSinceLastActivity = Math.floor((now.getTime() - input.lastActivityAt.getTime()) / msPerDay);

  return {
    totalDurationDays: Math.round(totalDurationDays),
    toleranceDays,
    daysSinceLastActivity,
    isStalled: daysSinceLastActivity > toleranceDays,
    daysUntilStall: toleranceDays - daysSinceLastActivity,
  };
}
