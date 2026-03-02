"use client";

import { TIME_BLOCKS, MODE_STATUS_COLORS, formatTimeRange } from "@/lib/constants";
import type { TimeBlockKey, AvailabilityStatus, AvailabilityMode } from "@/lib/constants";

export interface CellData {
  status: AvailabilityStatus;
  mode: AvailabilityMode;
}

interface AvailabilityGridProps {
  year: number;
  month: number; // 0-indexed
  data: Map<string, CellData>; // key: "YYYY-MM-DD|timeBlock"
  enabledBlocks: TimeBlockKey[];
  onToggle: (date: string, timeBlock: TimeBlockKey) => void;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function formatDate(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

export default function AvailabilityGrid({ year, month, data, enabledBlocks, onToggle }: AvailabilityGridProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="overflow-x-auto">
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
          {enabledBlocks.map((block) => {
            const info = TIME_BLOCKS[block];
            return (
              <tr key={block}>
                <td className="sticky left-0 z-10 bg-white px-2 py-1 dark:bg-zinc-950">
                  <div className="font-medium text-zinc-700 dark:text-zinc-300">
                    {info.label}
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    {formatTimeRange(info.start, info.end)}
                  </div>
                </td>
                {days.map((day) => {
                  const date = formatDate(year, month, day);
                  const key = `${date}|${block}`;
                  const cell = data.get(key);
                  const colors = cell
                    ? MODE_STATUS_COLORS[cell.mode][cell.status === "no" ? "yes" : cell.status as "yes" | "maybe"]
                    : null;

                  // Only color for yes/maybe
                  const hasColor = cell && (cell.status === "yes" || cell.status === "maybe");

                  return (
                    <td key={day} className="px-0.5 py-0.5">
                      <button
                        onClick={() => onToggle(date, block)}
                        className={`h-7 w-full min-w-[1.75rem] rounded transition-colors ${
                          hasColor && colors
                            ? `${colors.bg} ${colors.text}`
                            : "border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                        }`}
                        title={`${date} ${info.label}: ${hasColor && colors ? colors.label : "Not set"}`}
                      >
                        {cell?.status === "yes" ? "Y" : cell?.status === "maybe" ? "?" : ""}
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
        <span className="font-medium text-zinc-600 dark:text-zinc-400">Legend:</span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-emerald-500" /> In-Person
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-blue-500" /> Online
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-violet-500" /> Either
        </span>
        <span className="text-zinc-400">|</span>
        <span>Solid = Available, Lighter = Maybe</span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded border border-zinc-200 dark:border-zinc-700" /> Not set
        </span>
      </div>
    </div>
  );
}
