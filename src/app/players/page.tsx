import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function PlayersPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");
  if (!session.user.isGM) redirect("/dashboard");

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const players = await prisma.user.findMany({
    where: { isGM: false },
    include: {
      memberships: { include: { campaign: { select: { name: true } } } },
      availability: {
        where: { date: { startsWith: currentMonth } },
        select: { id: true, updatedAt: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold">Players</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-700">
              <th className="pb-2 pr-4 font-medium text-zinc-500">Name</th>
              <th className="pb-2 pr-4 font-medium text-zinc-500">Timezone</th>
              <th className="pb-2 pr-4 font-medium text-zinc-500">Campaigns</th>
              <th className="pb-2 pr-4 font-medium text-zinc-500">
                Slots ({currentMonth})
              </th>
              <th className="pb-2 font-medium text-zinc-500">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => {
              const campaignNames = player.memberships
                .map((m) => m.campaign.name)
                .join(", ");
              const slotCount = player.availability.length;
              const lastUpdated = player.availability.length > 0
                ? player.availability.reduce((latest, a) =>
                    a.updatedAt > latest ? a.updatedAt : latest,
                  player.availability[0].updatedAt)
                : null;

              return (
                <tr
                  key={player.id}
                  className="border-b border-zinc-100 dark:border-zinc-800"
                >
                  <td className="py-2.5 pr-4 font-medium">{player.name}</td>
                  <td className="py-2.5 pr-4 text-zinc-500">{player.timezone}</td>
                  <td className="py-2.5 pr-4 text-zinc-500">
                    {campaignNames || "None"}
                  </td>
                  <td className="py-2.5 pr-4">
                    {slotCount > 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {slotCount} slots
                      </span>
                    ) : (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                        None submitted
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-zinc-500">
                    {lastUpdated
                      ? new Date(lastUpdated).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              );
            })}
            {players.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-zinc-400">
                  No players registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
