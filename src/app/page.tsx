import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center">
      <main className="flex flex-col items-center gap-8 p-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-black dark:text-zinc-50">
          QuestCal
        </h1>
        <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
          TTRPG session scheduling across multiple campaigns with overlapping
          players.
        </p>
        <div className="flex gap-4">
          <Link
            href="/auth/signin"
            className="rounded-md bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-md border border-zinc-300 px-6 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Sign Up
          </Link>
        </div>
      </main>
    </div>
  );
}
