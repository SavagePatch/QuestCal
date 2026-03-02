"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import MonthNav from "@/components/MonthNav";
import AvailabilityGrid, { type CellData } from "@/components/AvailabilityGrid";
import { ALL_BLOCK_KEYS, MODE_LABELS } from "@/lib/constants";
import type { TimeBlockKey, AvailabilityStatus, AvailabilityMode } from "@/lib/constants";

interface AvailabilityRecord {
  date: string;
  timeBlock: string;
  status: string;
  mode: string;
}

function monthStr(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export default function AvailabilityPage() {
  const { data: session, status } = useSession();
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [data, setData] = useState<Map<string, CellData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<AvailabilityMode>("either");
  const [enabledBlocks, setEnabledBlocks] = useState<TimeBlockKey[]>(ALL_BLOCK_KEYS);
  const [blockSettingsOpen, setBlockSettingsOpen] = useState(false);

  const isGM = session?.user?.isGM ?? false;

  // Fetch enabled blocks setting
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/settings/time-blocks")
      .then((res) => res.json())
      .then((d) => setEnabledBlocks(d.enabledBlocks));
  }, [status]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/availability?month=${monthStr(year, month)}`);
    if (res.ok) {
      const records: AvailabilityRecord[] = await res.json();
      const map = new Map<string, CellData>();
      for (const r of records) {
        map.set(`${r.date}|${r.timeBlock}`, {
          status: r.status as AvailabilityStatus,
          mode: (r.mode as AvailabilityMode) || "either",
        });
      }
      setData(map);
    }
    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status, fetchData]);

  function handleMonthChange(newYear: number, newMonth: number) {
    setYear(newYear);
    setMonth(newMonth);
  }

  async function handleToggle(date: string, timeBlock: TimeBlockKey) {
    const key = `${date}|${timeBlock}`;
    const current = data.get(key);

    // Cycle: empty -> yes -> maybe -> empty
    let nextStatus: AvailabilityStatus | null;
    if (!current) {
      nextStatus = "yes";
    } else if (current.status === "yes") {
      nextStatus = "maybe";
    } else {
      nextStatus = null;
    }

    // Optimistic update
    const newData = new Map(data);
    if (nextStatus) {
      newData.set(key, { status: nextStatus, mode });
    } else {
      newData.delete(key);
    }
    setData(newData);

    // Send to API
    const res = await fetch("/api/availability", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, timeBlock, status: nextStatus, mode }),
    });

    if (!res.ok) {
      // Revert on failure
      if (current) {
        setData((prev) => new Map(prev).set(key, current));
      } else {
        setData((prev) => {
          const m = new Map(prev);
          m.delete(key);
          return m;
        });
      }
    }
  }

  async function toggleBlock(block: TimeBlockKey) {
    const isEnabled = enabledBlocks.includes(block);
    const next = isEnabled
      ? enabledBlocks.filter((b) => b !== block)
      : [...enabledBlocks, block].sort(
          (a, b) => ALL_BLOCK_KEYS.indexOf(a) - ALL_BLOCK_KEYS.indexOf(b)
        );

    if (next.length === 0) return; // At least one required

    setEnabledBlocks(next);
    await fetch("/api/settings/time-blocks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabledBlocks: next }),
    });
  }

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
        <h1 className="text-2xl font-bold">My Availability</h1>
        <div className="flex items-center gap-4">
          {/* Mode selector */}
          <div className="flex items-center gap-1 rounded-md border border-zinc-200 p-0.5 dark:border-zinc-700">
            {(Object.keys(MODE_LABELS) as AvailabilityMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  mode === m
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
          <MonthNav year={year} month={month} onChange={handleMonthChange} />
        </div>
      </div>

      <p className="mb-4 text-sm text-zinc-500">
        Select a mode above, then click cells to cycle: empty &rarr; Available &rarr; Maybe &rarr; empty
      </p>

      {/* GM block settings */}
      {isGM && (
        <div className="mb-4">
          <button
            onClick={() => setBlockSettingsOpen(!blockSettingsOpen)}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            {blockSettingsOpen ? "Hide" : "Configure"} time blocks {blockSettingsOpen ? "\u25B2" : "\u25BC"}
          </button>
          {blockSettingsOpen && (
            <div className="mt-2 flex gap-3">
              {ALL_BLOCK_KEYS.map((block) => (
                <label key={block} className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={enabledBlocks.includes(block)}
                    onChange={() => toggleBlock(block)}
                    className="rounded"
                  />
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {block === "morning" ? "Morning" : block === "afternoon" ? "Afternoon" : block === "evening" ? "Evening" : "Late Night"}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <AvailabilityGrid
        year={year}
        month={month}
        data={data}
        enabledBlocks={enabledBlocks}
        onToggle={handleToggle}
      />
    </div>
  );
}
