"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import MonthNav from "@/components/MonthNav";
import HeatmapGrid from "@/components/HeatmapGrid";
import CampaignSelect from "@/components/CampaignSelect";

interface HeatmapCell {
  date: string;
  timeBlock: string;
  yesCount: number;
  maybeCount: number;
  totalMembers: number;
  players: { name: string; status: string }[];
}

interface Campaign {
  id: string;
  name: string;
}

function monthStr(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export default function HeatmapPage() {
  const { data: session, status } = useSession();
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [campaignId, setCampaignId] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [data, setData] = useState<Map<string, HeatmapCell>>(new Map());
  const [totalMembers, setTotalMembers] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch campaigns on mount
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.isGM) return;
    fetch("/api/campaigns")
      .then((res) => res.json())
      .then((result) => {
        setCampaigns(result.map((c: Campaign) => ({ id: c.id, name: c.name })));
      });
  }, [status, session?.user?.isGM]);

  const fetchHeatmap = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ month: monthStr(year, month) });
    if (campaignId) params.set("campaignId", campaignId);

    const res = await fetch(`/api/heatmap?${params}`);
    if (res.ok) {
      const cells: HeatmapCell[] = await res.json();
      const map = new Map<string, HeatmapCell>();
      let maxMembers = 0;
      for (const cell of cells) {
        map.set(`${cell.date}|${cell.timeBlock}`, cell);
        if (cell.totalMembers > maxMembers) maxMembers = cell.totalMembers;
      }
      setData(map);
      setTotalMembers(maxMembers);
    }
    setLoading(false);
  }, [year, month, campaignId]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.isGM) {
      fetchHeatmap();
    }
  }, [status, session?.user?.isGM, fetchHeatmap]);

  if (status === "loading" || loading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-4 h-64 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Availability Heatmap</h1>
        <div className="flex items-center gap-4">
          <CampaignSelect
            campaigns={campaigns}
            value={campaignId}
            onChange={setCampaignId}
          />
          <MonthNav year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
        </div>
      </div>
      {totalMembers === 0 ? (
        <p className="text-zinc-500">No availability data for this month.</p>
      ) : (
        <HeatmapGrid year={year} month={month} data={data} totalMembers={totalMembers} />
      )}
    </div>
  );
}
