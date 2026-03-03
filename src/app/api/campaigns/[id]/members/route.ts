import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
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

  const memberships = await prisma.campaignMembership.findMany({
    where: { campaignId: id },
    include: {
      user: { select: { id: true, name: true, timezone: true, isGM: true } },
    },
  });

  const members = memberships.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    timezone: m.user.timezone,
    isGM: m.user.isGM,
  }));

  return NextResponse.json(members);
}

export async function POST(
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
  const body = await request.json();
  const { userId } = body;

  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  // Verify campaign exists and GM is a member
  const gmMembership = await prisma.campaignMembership.findFirst({
    where: { campaignId: id, userId: session.user.id },
  });
  if (!gmMembership) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  // Check if already a member
  const existing = await prisma.campaignMembership.findFirst({
    where: { campaignId: id, userId },
  });
  if (existing) {
    return NextResponse.json({ error: "Already a member" }, { status: 409 });
  }

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await prisma.campaignMembership.create({
    data: { campaignId: id, userId },
  });

  return NextResponse.json({ id: user.id, name: user.name }, { status: 201 });
}

export async function DELETE(
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
  const body = await request.json();
  const { userId } = body;

  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  // Don't allow removing the GM themselves
  if (userId === session.user.id) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  await prisma.campaignMembership.deleteMany({
    where: { campaignId: id, userId },
  });

  return NextResponse.json({ removed: true });
}
