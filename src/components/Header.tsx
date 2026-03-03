"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import NotificationBell from "@/components/NotificationBell";

export default function Header() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <header className="h-14 border-b border-zinc-200 dark:border-zinc-800" />
    );
  }

  if (!session) {
    return null;
  }

  const isGM = session.user?.isGM;

  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
      <nav className="flex items-center gap-4">
        <Link href="/dashboard" className="text-lg font-bold">
          QuestCal
        </Link>
        <Link
          href="/dashboard"
          className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Dashboard
        </Link>
        <Link
          href="/availability"
          className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          My Availability
        </Link>
        {isGM && (
          <>
            <Link
              href="/heatmap"
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Heatmap
            </Link>
            <Link
              href="/players"
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Players
            </Link>
            <Link
              href="/campaigns"
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Campaigns
            </Link>
          </>
        )}
      </nav>
      <div className="flex items-center gap-3">
        <NotificationBell />
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {session.user?.name}
        </span>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-md bg-zinc-100 px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
