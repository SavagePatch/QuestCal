"use client";

import { TIME_BLOCKS } from "@/lib/constants";
import type { TimeBlockKey } from "@/lib/constants";

interface TopSlot {
  date: string;
  timeBlock: string;
  yesCount: number;
  maybeCount: number;
  totalMembers: number;
}

interface TopSlotsProps {
  slots: TopSlot[];
}

export default function TopSlots({ slots }: TopSlotsProps) {
  if (slots.length === 0) return null;

  return (
    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
      <h3 className="mb-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
        Best Times to Schedule
      </h3>
      <div className="flex flex-wrap gap-2">
        {slots.map((slot, i) => {
          const blockLabel = TIME_BLOCKS[slot.timeBlock as TimeBlockKey]?.label ?? slot.timeBlock;
          const dateObj = new Date(slot.date + "T12:00:00");
          const dayName = dateObj.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" });
          const ratio = slot.totalMembers > 0 ? (slot.yesCount + slot.maybeCount) / slot.totalMembers : 0;
          const isPerfect = ratio >= 1;

          return (
            <div
              key={`${slot.date}|${slot.timeBlock}`}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                isPerfect
                  ? "border-purple-300 bg-purple-100 dark:border-purple-700 dark:bg-purple-950/40"
                  : "border-amber-200 bg-white dark:border-amber-700 dark:bg-zinc-900"
              }`}
            >
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">#{i + 1}</span>
              <div>
                <div className="font-medium text-zinc-800 dark:text-zinc-200">{dayName}</div>
                <div className="text-xs text-zinc-500">{blockLabel}</div>
              </div>
              <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                isPerfect
                  ? "bg-purple-600 text-amber-300"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
              }`}>
                {slot.yesCount}/{slot.totalMembers}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
