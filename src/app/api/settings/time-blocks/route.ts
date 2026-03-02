import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ALL_BLOCK_KEYS } from "@/lib/constants";
import type { TimeBlockKey } from "@/lib/constants";

async function getSettings() {
  let settings = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  if (!settings) {
    settings = await prisma.siteSettings.create({
      data: { id: "default", enabledBlocks: JSON.stringify(ALL_BLOCK_KEYS) },
    });
  }
  return settings;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getSettings();
  const enabledBlocks: TimeBlockKey[] = JSON.parse(settings.enabledBlocks);

  return NextResponse.json({ enabledBlocks });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.isGM) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { enabledBlocks } = body;

  if (!Array.isArray(enabledBlocks) || enabledBlocks.length === 0) {
    return NextResponse.json({ error: "At least one block must be enabled" }, { status: 400 });
  }

  // Validate all keys
  for (const key of enabledBlocks) {
    if (!ALL_BLOCK_KEYS.includes(key as TimeBlockKey)) {
      return NextResponse.json({ error: `Invalid block key: ${key}` }, { status: 400 });
    }
  }

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: { enabledBlocks: JSON.stringify(enabledBlocks) },
    create: { id: "default", enabledBlocks: JSON.stringify(enabledBlocks) },
  });

  return NextResponse.json({ enabledBlocks });
}
