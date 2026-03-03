import { NextRequest, NextResponse } from "next/server";
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

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.isGM) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { name, description } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Campaign name is required" }, { status: 400 });
  }

  const campaign = await prisma.campaign.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      memberships: {
        create: { userId: session.user.id },
      },
    },
  });

  return NextResponse.json(
    {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      members: [],
      sessions: [],
    },
    { status: 201 }
  );
}
