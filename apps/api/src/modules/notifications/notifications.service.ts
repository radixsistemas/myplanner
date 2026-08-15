import type { EntityType } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";
import { sendEmail } from "../../email/mailer";
import { stallAlertTemplate } from "../../email/templates/stall-alert";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

async function wasNotifiedRecently(
  entityType: EntityType,
  entityId: string,
  recipientUserId: string,
  reminderIntervalDays: number,
): Promise<boolean> {
  const last = await prisma.stallNotification.findFirst({
    where: { entityType, entityId, recipientUserId },
    orderBy: { sentAt: "desc" },
  });
  if (!last) return false;
  return Date.now() - last.sentAt.getTime() < reminderIntervalDays * ONE_DAY_MS;
}

export interface NotifyStalledInput {
  entityType: Extract<EntityType, "ROADMAP_ITEM" | "PROJECT">;
  entityId: string;
  entityTitle: string;
  recipientUserId: string;
  daysSinceLastActivity: number;
  toleranceDays: number;
  reminderIntervalDays: number;
}

/** Envia (respeitando throttle e preferências) o alerta de estagnação e registra o histórico. Retorna se enviou. */
export async function notifyStalled(input: NotifyStalledInput): Promise<boolean> {
  const alreadyNotified = await wasNotifiedRecently(
    input.entityType,
    input.entityId,
    input.recipientUserId,
    input.reminderIntervalDays,
  );
  if (alreadyNotified) return false;

  const recipient = await prisma.user.findUnique({
    where: { id: input.recipientUserId },
    include: { notificationPreference: true },
  });
  if (!recipient) return false;
  if (recipient.notificationPreference && !recipient.notificationPreference.stallAlertsEmail) return false;

  const entityUrl =
    input.entityType === "ROADMAP_ITEM"
      ? `${env.APP_BASE_URL}/roadmap/${input.entityId}`
      : `${env.APP_BASE_URL}/projects/${input.entityId}`;

  const { subject, html, text } = stallAlertTemplate({
    recipientName: recipient.name,
    entityTitle: input.entityTitle,
    entityKind: input.entityType === "ROADMAP_ITEM" ? "item de roadmap" : "projeto",
    daysSinceLastActivity: input.daysSinceLastActivity,
    toleranceDays: input.toleranceDays,
    entityUrl,
  });

  await sendEmail({ to: recipient.email, subject, html, text });

  await prisma.stallNotification.create({
    data: { entityType: input.entityType, entityId: input.entityId, recipientUserId: input.recipientUserId },
  });

  return true;
}
