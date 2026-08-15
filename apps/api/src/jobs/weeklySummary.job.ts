import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { sendEmail } from "../email/mailer";
import { weeklySummaryTemplate } from "../email/templates/weekly-summary";
import { getDashboard } from "../modules/dashboard.service";

export async function weeklySummaryJob() {
  console.log("[job:weeklySummary] iniciando envio de resumos semanais...");
  const users = await prisma.user.findMany({ include: { notificationPreference: true } });
  let sent = 0;

  for (const user of users) {
    if (user.notificationPreference && !user.notificationPreference.weeklySummaryEmail) continue;

    const dashboard = await getDashboard(
      { id: user.id, name: user.name, email: user.email, globalRole: user.globalRole },
      {},
    );

    const overdueForUser = dashboard.overdueTasks.filter((task) => task.assigneeId === user.id);
    const roadmapItemsCount =
      dashboard.roadmapByHorizon.SHORT.length +
      dashboard.roadmapByHorizon.MEDIUM.length +
      dashboard.roadmapByHorizon.LONG.length;

    const { subject, html } = weeklySummaryTemplate({
      recipientName: user.name,
      activeProjectsCount: dashboard.activeProjects.length,
      roadmapItemsCount,
      stalledCount: dashboard.stalledItems.length,
      overdueTasks: overdueForUser.map((task) => ({
        title: task.title,
        projectTitle: task.project.title,
        dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString("pt-BR") : "",
        url: `${env.APP_BASE_URL}/projects/${task.project.id}`,
      })),
      dashboardUrl: `${env.APP_BASE_URL}/dashboard`,
    });

    await sendEmail({ to: user.email, subject, html });
    sent++;
  }

  console.log(`[job:weeklySummary] concluído: ${sent} resumos enviados.`);
}
