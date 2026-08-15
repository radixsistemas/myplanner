import { wrapEmail } from "./layout";

interface WeeklySummaryTemplateInput {
  recipientName: string;
  activeProjectsCount: number;
  roadmapItemsCount: number;
  stalledCount: number;
  overdueTasks: { title: string; projectTitle: string; dueDate: string; url: string }[];
  dashboardUrl: string;
}

export function weeklySummaryTemplate(input: WeeklySummaryTemplateInput) {
  const subject = "Resumo semanal · Mapa de Expansão";

  const overdueList = input.overdueTasks.length
    ? `<ul style="padding-left:20px;margin:0 0 16px;">
        ${input.overdueTasks
          .map(
            (task) =>
              `<li><a href="${task.url}">${task.title}</a> — ${task.projectTitle} (venceu em ${task.dueDate})</li>`,
          )
          .join("")}
      </ul>`
    : `<p style="color:#64748b;">Nenhuma tarefa atrasada atribuída a você. 🎉</p>`;

  const body = `
    <p>Olá, ${input.recipientName},</p>
    <p>Aqui está o resumo da sua semana:</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">Projetos ativos nos seus times</td>
        <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;">${input.activeProjectsCount}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">Itens de roadmap ativos</td>
        <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;">${input.roadmapItemsCount}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;">Itens sinalizados como parados</td>
        <td style="padding:8px 0;text-align:right;font-weight:600;color:${input.stalledCount > 0 ? "#dc2626" : "#16a34a"};">${input.stalledCount}</td>
      </tr>
    </table>
    <h2 style="font-size:14px;margin:24px 0 8px;">Suas tarefas atrasadas</h2>
    ${overdueList}
    <p style="margin-top:24px;">
      <a href="${input.dashboardUrl}" style="background:#2563eb;color:#ffffff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600;">
        Ver dashboard completo
      </a>
    </p>
  `;

  return { subject, html: wrapEmail(subject, body), text: undefined };
}
