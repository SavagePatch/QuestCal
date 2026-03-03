import { prisma } from "@/lib/prisma";
import { TIME_BLOCKS } from "@/lib/constants";
import type { TimeBlockKey } from "@/lib/constants";

export async function notifySessionScheduled(
  campaignId: string,
  sessionId: string,
  date: string,
  timeBlock: string,
  title: string | null,
  gmUserId: string
) {
  const blockLabel = TIME_BLOCKS[timeBlock as TimeBlockKey]?.label ?? timeBlock;
  const sessionLabel = title ? `"${title}"` : `session on ${date}`;
  const message = `New ${blockLabel} ${sessionLabel} has been scheduled.`;

  const members = await prisma.campaignMembership.findMany({
    where: { campaignId, userId: { not: gmUserId } },
    select: { userId: true },
  });

  if (members.length === 0) return;

  await prisma.notification.createMany({
    data: members.map((m) => ({
      userId: m.userId,
      sessionId,
      type: "session_scheduled",
      message,
    })),
  });
}

export async function notifySessionCancelled(
  sessionId: string,
  date: string,
  timeBlock: string,
  title: string | null,
  campaignId: string | null,
  gmUserId: string
) {
  if (!campaignId) return;

  const blockLabel = TIME_BLOCKS[timeBlock as TimeBlockKey]?.label ?? timeBlock;
  const sessionLabel = title ? `"${title}"` : `session on ${date}`;
  const message = `The ${blockLabel} ${sessionLabel} has been cancelled.`;

  const members = await prisma.campaignMembership.findMany({
    where: { campaignId, userId: { not: gmUserId } },
    select: { userId: true },
  });

  if (members.length === 0) return;

  await prisma.notification.createMany({
    data: members.map((m) => ({
      userId: m.userId,
      sessionId: null,
      type: "session_cancelled",
      message,
    })),
  });
}
