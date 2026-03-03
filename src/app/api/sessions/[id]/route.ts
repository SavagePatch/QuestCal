import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TIME_BLOCKS } from "@/lib/constants";
import { notifySessionCancelled } from "@/lib/notifications";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.isGM) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.gameSession.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const body = await request.json();
  const { date, timeBlock, title, notes, status } = body;

  const updateData: Record<string, unknown> = {};
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) updateData.date = date;
  if (timeBlock && timeBlock in TIME_BLOCKS) updateData.timeBlock = timeBlock;
  if (title !== undefined) updateData.title = title || null;
  if (notes !== undefined) updateData.notes = notes || null;
  if (status === "scheduled" || status === "cancelled") updateData.status = status;

  const updated = await prisma.gameSession.update({
    where: { id },
    data: updateData,
  });

  // If status changed to cancelled, notify members
  if (status === "cancelled" && existing.status !== "cancelled") {
    notifySessionCancelled(
      id,
      existing.date,
      existing.timeBlock,
      existing.title,
      existing.campaignId,
      session.user.id
    ).catch(console.error);
  }

  return NextResponse.json({
    id: updated.id,
    campaignId: updated.campaignId,
    date: updated.date,
    timeBlock: updated.timeBlock,
    title: updated.title,
    notes: updated.notes,
    status: updated.status,
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.isGM) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.gameSession.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Notify members before deleting
  notifySessionCancelled(
    id,
    existing.date,
    existing.timeBlock,
    existing.title,
    existing.campaignId,
    session.user.id
  ).catch(console.error);

  await prisma.gameSession.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}
