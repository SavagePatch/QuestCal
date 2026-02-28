import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Welcome, {session.user.name}!
        {session.user.isGM ? " (Game Master)" : " (Player)"}
      </p>
      <p className="mt-1 text-sm text-zinc-500">
        Timezone: {session.user.timezone}
      </p>
    </div>
  );
}
