import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  // Verify GM is a member of the campaign
  const membership = await prisma.campaignMembership.findFirst({
    where: { campaignId: id, userId: session.user.id },
  });
  if (!membership) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const body = await request.json();
  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined && typeof body.name === "string" && body.name.trim()) {
    updateData.name = body.name.trim();
  }
  if (body.description !== undefined) {
    updateData.description = body.description?.trim() || null;
  }

  const updated = await prisma.campaign.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    description: updated.description,
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

  const membership = await prisma.campaignMembership.findFirst({
    where: { campaignId: id, userId: session.user.id },
  });
  if (!membership) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  await prisma.campaign.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}
