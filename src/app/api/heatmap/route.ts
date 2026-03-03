import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.isGM) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const campaignId = request.nextUrl.searchParams.get("campaignId");
  const month = request.nextUrl.searchParams.get("month");
  const modeFilter = request.nextUrl.searchParams.get("mode"); // "in_person" | "online" | "either" | null
  const suggest = request.nextUrl.searchParams.get("suggest") === "true";

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(
      { error: "month query param required (YYYY-MM)" },
      { status: 400 }
    );
  }

  // Get member userIds for the campaign(s)
  const membershipWhere = campaignId
    ? { campaignId }
    : { campaign: { memberships: { some: { userId: session.user.id } } } };

  const memberships = await prisma.campaignMembership.findMany({
    where: membershipWhere,
    include: { user: { select: { id: true, name: true, isGM: true } } },
  });

  // Deduplicate users (a player can be in multiple campaigns)
  const playerMap = new Map<string, string>();
  for (const m of memberships) {
    if (!m.user.isGM) {
      playerMap.set(m.user.id, m.user.name);
    }
  }
  const playerIds = Array.from(playerMap.keys());
  const totalMembers = playerIds.length;

  if (totalMembers === 0) {
    return NextResponse.json([]);
  }

  // Fetch availability for those players in the given month, optionally filtered by mode
  const availabilityWhere: Record<string, unknown> = {
    userId: { in: playerIds },
    date: { startsWith: month },
  };
  // When filtering: "in_person" or "online" also includes "either" (available for both)
  if (modeFilter === "in_person") {
    availabilityWhere.mode = { in: ["in_person", "either"] };
  } else if (modeFilter === "online") {
    availabilityWhere.mode = { in: ["online", "either"] };
  }
  // modeFilter === "either" or null → show all records (no filter)

  const availability = await prisma.availability.findMany({
    where: availabilityWhere,
    select: { userId: true, date: true, timeBlock: true, status: true, mode: true },
  });

  // Aggregate by (date, timeBlock)
  const cellMap = new Map<
    string,
    {
      yesCount: number;
      maybeCount: number;
      players: { name: string; status: string; mode: string }[];
    }
  >();

  for (const record of availability) {
    const key = `${record.date}|${record.timeBlock}`;
    if (!cellMap.has(key)) {
      cellMap.set(key, { yesCount: 0, maybeCount: 0, players: [] });
    }
    const cell = cellMap.get(key)!;
    if (record.status === "yes") cell.yesCount++;
    if (record.status === "maybe") cell.maybeCount++;
    cell.players.push({
      name: playerMap.get(record.userId) ?? "Unknown",
      status: record.status,
      mode: record.mode,
    });
  }

  const result = Array.from(cellMap.entries()).map(([key, data]) => {
    const [date, timeBlock] = key.split("|");
    return {
      date,
      timeBlock,
      yesCount: data.yesCount,
      maybeCount: data.maybeCount,
      totalMembers,
      players: data.players,
    };
  });

  if (!suggest) {
    return NextResponse.json(result);
  }

  // Build topSlots: rank by yesCount desc, then maybeCount desc, only future dates
  const today = new Date().toISOString().slice(0, 10);
  const topSlots = [...result]
    .filter((s) => s.date >= today && (s.yesCount + s.maybeCount) > 0)
    .sort((a, b) => {
      if (b.yesCount !== a.yesCount) return b.yesCount - a.yesCount;
      return b.maybeCount - a.maybeCount;
    })
    .slice(0, 5)
    .map((s) => ({
      date: s.date,
      timeBlock: s.timeBlock,
      yesCount: s.yesCount,
      maybeCount: s.maybeCount,
      totalMembers: s.totalMembers,
    }));

  return NextResponse.json({ cells: result, topSlots });
}
