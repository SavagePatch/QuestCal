import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.isGM) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const campaigns = await prisma.campaign.findMany({
    where: {
      memberships: { some: { userId: session.user.id } },
    },
    include: {
      memberships: {
        include: {
          user: { select: { id: true, name: true, isGM: true } },
        },
      },
      sessions: {
        where: { status: "scheduled" },
        orderBy: { date: "asc" },
        select: {
          id: true,
          date: true,
          timeBlock: true,
          title: true,
          status: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const result = campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    members: c.memberships
      .filter((m) => !m.user.isGM)
      .map((m) => ({ id: m.user.id, name: m.user.name })),
    sessions: c.sessions,
  }));

  return NextResponse.json(result);
}
