"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import MonthNav from "@/components/MonthNav";
import AvailabilityGrid from "@/components/AvailabilityGrid";
import type { TimeBlockKey, AvailabilityStatus } from "@/lib/constants";

interface AvailabilityRecord {
  date: string;
  timeBlock: string;
  status: string;
}

function monthStr(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export default function AvailabilityPage() {
  const { status } = useSession();
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [data, setData] = useState<Map<string, AvailabilityStatus>>(new Map());
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/availability?month=${monthStr(year, month)}`);
    if (res.ok) {
      const records: AvailabilityRecord[] = await res.json();
      const map = new Map<string, AvailabilityStatus>();
      for (const r of records) {
        map.set(`${r.date}|${r.timeBlock}`, r.status as AvailabilityStatus);
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
    let next: AvailabilityStatus | null;
    if (!current) {
      next = "yes";
    } else if (current === "yes") {
      next = "maybe";
    } else {
      next = null;
    }

    // Optimistic update
    const newData = new Map(data);
    if (next) {
      newData.set(key, next);
    } else {
      newData.delete(key);
    }
    setData(newData);

    // Send to API
    const res = await fetch("/api/availability", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, timeBlock, status: next }),
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Availability</h1>
        <MonthNav year={year} month={month} onChange={handleMonthChange} />
      </div>
      <p className="mb-4 text-sm text-zinc-500">
        Click a cell to cycle: empty &rarr; Available &rarr; Maybe &rarr; empty
      </p>
      <AvailabilityGrid year={year} month={month} data={data} onToggle={handleToggle} />
    </div>
  );
}
