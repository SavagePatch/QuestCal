"use client";

import { TIME_BLOCKS } from "@/lib/constants";
import type { TimeBlockKey } from "@/lib/constants";
import { useState } from "react";

interface HeatmapCell {
  date: string;
  timeBlock: string;
  yesCount: number;
  maybeCount: number;
  totalMembers: number;
  players: { name: string; status: string }[];
}

interface HeatmapGridProps {
  year: number;
  month: number; // 0-indexed
  data: Map<string, HeatmapCell>; // key: "YYYY-MM-DD|timeBlock"
  totalMembers: number;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function formatDate(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function getHeatColor(available: number, total: number): string {
  if (total === 0 || available === 0) return "bg-zinc-100 dark:bg-zinc-800";
  const ratio = available / total;
  if (ratio >= 1) return "bg-emerald-500";
  if (ratio >= 0.75) return "bg-emerald-400";
  if (ratio >= 0.5) return "bg-amber-300";
  if (ratio >= 0.25) return "bg-amber-200";
  return "bg-amber-100";
}

const blockKeys = Object.keys(TIME_BLOCKS) as TimeBlockKey[];

export default function HeatmapGrid({ year, month, data, totalMembers }: HeatmapGridProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const [tooltip, setTooltip] = useState<{ key: string; x: number; y: number } | null>(null);

  function handleMouseEnter(key: string, e: React.MouseEvent) {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setTooltip({ key, x: rect.left, y: rect.bottom + 4 });
  }

  const tooltipCell = tooltip ? data.get(tooltip.key) : null;

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-white px-2 py-1 text-left text-zinc-500 dark:bg-zinc-950">
              Time
            </th>
            {days.map((day) => {
              const dateObj = new Date(year, month, day);
              const dayName = dateObj.toLocaleDateString("en", { weekday: "short" });
              const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
              return (
                <th
                  key={day}
                  className={`px-0.5 py-1 text-center font-normal ${
                    isWeekend ? "text-zinc-400" : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  <div>{dayName}</div>
                  <div>{day}</div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {blockKeys.map((block) => (
            <tr key={block}>
              <td className="sticky left-0 z-10 bg-white px-2 py-1 font-medium text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
                {TIME_BLOCKS[block].label}
              </td>
              {days.map((day) => {
                const date = formatDate(year, month, day);
                const key = `${date}|${block}`;
                const cell = data.get(key);
                const available = cell ? cell.yesCount + cell.maybeCount : 0;
                const total = totalMembers;

                return (
                  <td key={day} className="px-0.5 py-0.5">
                    <div
                      className={`flex h-7 min-w-[1.75rem] items-center justify-center rounded text-[10px] font-medium ${getHeatColor(available, total)} ${
                        available > 0
                          ? "cursor-default text-zinc-800"
                          : "text-zinc-400 dark:text-zinc-600"
                      }`}
                      onMouseEnter={(e) => cell && handleMouseEnter(key, e)}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      {available > 0 ? `${available}/${total}` : ""}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {tooltip && tooltipCell && (
        <div
          className="fixed z-50 rounded-md border border-zinc-200 bg-white p-2 text-xs shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="mb-1 font-semibold">
            {tooltipCell.date} &middot; {TIME_BLOCKS[tooltipCell.timeBlock as TimeBlockKey]?.label}
          </div>
          {tooltipCell.players.map((p, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  p.status === "yes" ? "bg-emerald-500" : "bg-amber-400"
                }`}
              />
              <span>{p.name}</span>
              <span className="text-zinc-400">
                ({p.status === "yes" ? "Available" : "Maybe"})
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-emerald-500" /> All available
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-amber-300" /> Some available
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-zinc-100 dark:bg-zinc-800" /> None
        </span>
      </div>
    </div>
  );
}
