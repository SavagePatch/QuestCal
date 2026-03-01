import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TIME_BLOCKS } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.isGM) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { campaignId, date, timeBlock, title, notes } = body;

  if (!campaignId || typeof campaignId !== "string") {
    return NextResponse.json({ error: "campaignId required" }, { status: 400 });
  }

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  if (!timeBlock || !(timeBlock in TIME_BLOCKS)) {
    return NextResponse.json({ error: "Invalid timeBlock" }, { status: 400 });
  }

  // Verify campaign exists and GM is a member
  const membership = await prisma.campaignMembership.findFirst({
    where: { campaignId, userId: session.user.id },
  });
  if (!membership) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const gameSession = await prisma.gameSession.create({
    data: {
      campaignId,
      date,
      timeBlock,
      title: title || null,
      notes: notes || null,
      status: "scheduled",
    },
  });

  return NextResponse.json(
    {
      id: gameSession.id,
      campaignId: gameSession.campaignId,
      date: gameSession.date,
      timeBlock: gameSession.timeBlock,
      title: gameSession.title,
      status: gameSession.status,
    },
    { status: 201 }
  );
}
