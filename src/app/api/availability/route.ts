import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TIME_BLOCKS } from "@/lib/constants";
import type { TimeBlockKey, AvailabilityStatus, AvailabilityMode } from "@/lib/constants";

const VALID_MODES: AvailabilityMode[] = ["in_person", "online", "either"];

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const month = request.nextUrl.searchParams.get("month");
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(
      { error: "month query param required (YYYY-MM)" },
      { status: 400 }
    );
  }

  const records = await prisma.availability.findMany({
    where: {
      userId: session.user.id,
      date: { startsWith: month },
    },
    select: { date: true, timeBlock: true, status: true, mode: true },
  });

  return NextResponse.json(records);
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { date, timeBlock, status, mode } = body;

  if (!date || typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  if (!timeBlock || !(timeBlock in TIME_BLOCKS)) {
    return NextResponse.json({ error: "Invalid timeBlock" }, { status: 400 });
  }

  const validStatuses: AvailabilityStatus[] = ["yes", "maybe", "no"];

  // null status = delete the record
  if (status === null) {
    await prisma.availability.deleteMany({
      where: {
        userId: session.user.id,
        date,
        timeBlock,
      },
    });
    return NextResponse.json({ deleted: true });
  }

  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const resolvedMode: AvailabilityMode = VALID_MODES.includes(mode) ? mode : "either";

  const record = await prisma.availability.upsert({
    where: {
      userId_date_timeBlock: {
        userId: session.user.id,
        date,
        timeBlock: timeBlock as TimeBlockKey,
      },
    },
    update: { status, mode: resolvedMode },
    create: {
      userId: session.user.id,
      date,
      timeBlock: timeBlock as TimeBlockKey,
      status,
      mode: resolvedMode,
    },
  });

  return NextResponse.json({
    date: record.date,
    timeBlock: record.timeBlock,
    status: record.status,
    mode: record.mode,
  });
}
