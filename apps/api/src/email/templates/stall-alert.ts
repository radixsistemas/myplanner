import { wrapEmail } from "./layout";

interface StallAlertTemplateInput {
  recipientName: string;
  entityTitle: string;
  entityKind: "item de roadmap" | "projeto";
  daysSinceLastActivity: number;
  toleranceDays: number;
  entityUrl: string;
}

export function stallAlertTemplate(input: StallAlertTemplateInput) {
  const subject = `⚠️ ${input.entityKind === "projeto" ? "Projeto" : "Item de roadmap"} parado: ${input.entityTitle}`;

  const body = `
    <p>Olá, ${input.recipientName},</p>
    <p>O ${input.entityKind} <strong>${input.entityTitle}</strong> está sem nenhuma atualização há
    <strong>${input.daysSinceLastActivity} dias</strong> (tolerância configurada para este item:
    ${input.toleranceDays} dias).</p>
    <p>O que você pode fazer agora:</p>
    <ul style="padding-left:20px;margin:0 0 16px;">
      <li>Atualizar o status para refletir o andamento real</li>
      <li>Registrar um comentário justificando o atraso</li>
      <li>Pausar ou cancelar formalmente, se não for mais prioridade</li>
    </ul>
    <p style="margin-top:24px;">
      <a href="${input.entityUrl}" style="background:#2563eb;color:#ffffff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600;">
        Abrir ${input.entityKind}
      </a>
    </p>
  `;

  const text = `O ${input.entityKind} "${input.entityTitle}" está sem atualização há ${input.daysSinceLastActivity} dias (tolerância: ${input.toleranceDays} dias). Acesse: ${input.entityUrl}`;

  return { subject, html: wrapEmail(subject, body), text };
}
