"use client";

import { TIME_BLOCKS, STATUS_COLORS } from "@/lib/constants";
import type { TimeBlockKey, AvailabilityStatus } from "@/lib/constants";

interface AvailabilityGridProps {
  year: number;
  month: number; // 0-indexed
  data: Map<string, AvailabilityStatus>; // key: "YYYY-MM-DD|timeBlock"
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

const blockKeys = Object.keys(TIME_BLOCKS) as TimeBlockKey[];

export default function AvailabilityGrid({ year, month, data, onToggle }: AvailabilityGridProps) {
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
          {blockKeys.map((block) => (
            <tr key={block}>
              <td className="sticky left-0 z-10 bg-white px-2 py-1 font-medium text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
                {TIME_BLOCKS[block].label}
              </td>
              {days.map((day) => {
                const date = formatDate(year, month, day);
                const key = `${date}|${block}`;
                const status = data.get(key);
                const colors = status ? STATUS_COLORS[status] : null;

                return (
                  <td key={day} className="px-0.5 py-0.5">
                    <button
                      onClick={() => onToggle(date, block)}
                      className={`h-7 w-full min-w-[1.75rem] rounded transition-colors ${
                        colors
                          ? `${colors.bg} ${colors.text}`
                          : "border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                      }`}
                      title={`${date} ${TIME_BLOCKS[block].label}: ${colors?.label ?? "Not set"}`}
                    >
                      {status === "yes" ? "Y" : status === "maybe" ? "?" : ""}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <span className={`inline-block h-3 w-3 rounded ${STATUS_COLORS.yes.bg}`} />
          {STATUS_COLORS.yes.label}
        </span>
        <span className="flex items-center gap-1">
          <span className={`inline-block h-3 w-3 rounded ${STATUS_COLORS.maybe.bg}`} />
          {STATUS_COLORS.maybe.label}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded border border-zinc-200 dark:border-zinc-700" />
          Not set
        </span>
      </div>
    </div>
  );
}
