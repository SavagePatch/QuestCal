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

  const players = await prisma.user.findMany({
    where: { isGM: false },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(players);
}
