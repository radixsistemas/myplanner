import cron from "node-cron";
import { env } from "../config/env";
import { stallCheckJob } from "./stallCheck.job";
import { weeklySummaryJob } from "./weeklySummary.job";

export function startScheduledJobs(): void {
  cron.schedule(env.STALL_CHECK_CRON, () => {
    stallCheckJob().catch((err) => console.error("[job:stallCheck] erro:", err));
  });

  cron.schedule(env.WEEKLY_SUMMARY_CRON, () => {
    weeklySummaryJob().catch((err) => console.error("[job:weeklySummary] erro:", err));
  });

  console.log(`[jobs] agendados: stallCheck="${env.STALL_CHECK_CRON}", weeklySummary="${env.WEEKLY_SUMMARY_CRON}"`);
}
