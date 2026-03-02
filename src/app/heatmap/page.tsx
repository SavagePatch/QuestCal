"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import MonthNav from "@/components/MonthNav";
import HeatmapGrid from "@/components/HeatmapGrid";
import CampaignSelect from "@/components/CampaignSelect";
import { ALL_BLOCK_KEYS, MODE_LABELS } from "@/lib/constants";
import type { TimeBlockKey, AvailabilityMode } from "@/lib/constants";

interface HeatmapCell {
  date: string;
  timeBlock: string;
  yesCount: number;
  maybeCount: number;
  totalMembers: number;
  players: { name: string; status: string; mode: string }[];
}

interface Campaign {
  id: string;
  name: string;
}

interface GmAvailRecord {
  date: string;
  timeBlock: string;
  status: string;
  mode: string;
}

type ModeFilterValue = AvailabilityMode | "all";

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
  const [enabledBlocks, setEnabledBlocks] = useState<TimeBlockKey[]>(ALL_BLOCK_KEYS);
  const [showGmOverlay, setShowGmOverlay] = useState(false);
  const [gmAvailability, setGmAvailability] = useState<Map<string, { status: string; mode: string }>>(new Map());
  const [modeFilter, setModeFilter] = useState<ModeFilterValue>("all");

  // Fetch campaigns + enabled blocks on mount
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.isGM) return;
    fetch("/api/campaigns")
      .then((res) => res.json())
      .then((result) => {
        setCampaigns(result.map((c: Campaign) => ({ id: c.id, name: c.name })));
      });
    fetch("/api/settings/time-blocks")
      .then((res) => res.json())
      .then((d) => setEnabledBlocks(d.enabledBlocks));
  }, [status, session?.user?.isGM]);

  const fetchHeatmap = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ month: monthStr(year, month) });
    if (campaignId) params.set("campaignId", campaignId);
    if (modeFilter !== "all") params.set("mode", modeFilter);

    const [heatmapRes, gmRes] = await Promise.all([
      fetch(`/api/heatmap?${params}`),
      fetch(`/api/availability?month=${monthStr(year, month)}`),
    ]);

    if (heatmapRes.ok) {
      const cells: HeatmapCell[] = await heatmapRes.json();
      const map = new Map<string, HeatmapCell>();
      let maxMembers = 0;
      for (const cell of cells) {
        map.set(`${cell.date}|${cell.timeBlock}`, cell);
        if (cell.totalMembers > maxMembers) maxMembers = cell.totalMembers;
      }
      setData(map);
      setTotalMembers(maxMembers);
    }

    if (gmRes.ok) {
      const gmRecords: GmAvailRecord[] = await gmRes.json();
      const gmMap = new Map<string, { status: string; mode: string }>();
      for (const r of gmRecords) {
        gmMap.set(`${r.date}|${r.timeBlock}`, { status: r.status, mode: r.mode });
      }
      setGmAvailability(gmMap);
    }

    setLoading(false);
  }, [year, month, campaignId, modeFilter]);

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
          {/* Mode filter */}
          <div className="flex items-center gap-1 rounded-md border border-zinc-200 p-0.5 dark:border-zinc-700">
            <button
              onClick={() => setModeFilter("all")}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                modeFilter === "all"
                  ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              All
            </button>
            {(Object.keys(MODE_LABELS) as AvailabilityMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setModeFilter(m)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  modeFilter === m
                    ? m === "in_person"
                      ? "bg-emerald-500 text-white"
                      : m === "online"
                        ? "bg-blue-500 text-white"
                        : "bg-violet-500 text-white"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>
          <CampaignSelect
            campaigns={campaigns}
            value={campaignId}
            onChange={setCampaignId}
          />
          <MonthNav year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
        </div>
      </div>

      {/* GM overlay toggle */}
      <div className="mb-4">
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <input
            type="checkbox"
            checked={showGmOverlay}
            onChange={(e) => setShowGmOverlay(e.target.checked)}
            className="rounded"
          />
          Fade slots where I&apos;m unavailable
        </label>
      </div>

      {totalMembers === 0 ? (
        <p className="text-zinc-500">No availability data for this month.</p>
      ) : (
        <HeatmapGrid
          year={year}
          month={month}
          data={data}
          totalMembers={totalMembers}
          enabledBlocks={enabledBlocks}
          gmAvailability={gmAvailability}
          showGmOverlay={showGmOverlay}
        />
      )}
    </div>
  );
}
