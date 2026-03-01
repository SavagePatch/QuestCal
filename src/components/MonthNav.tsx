"use client";

interface MonthNavProps {
  year: number;
  month: number; // 0-indexed
  onChange: (year: number, month: number) => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function MonthNav({ year, month, onChange }: MonthNavProps) {
  function goPrev() {
    if (month === 0) {
      onChange(year - 1, 11);
    } else {
      onChange(year, month - 1);
    }
  }

  function goNext() {
    if (month === 11) {
      onChange(year + 1, 0);
    } else {
      onChange(year, month + 1);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={goPrev}
        className="rounded px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
        aria-label="Previous month"
      >
        &larr;
      </button>
      <span className="min-w-[10rem] text-center text-lg font-semibold">
        {MONTH_NAMES[month]} {year}
      </span>
      <button
        onClick={goNext}
        className="rounded px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
        aria-label="Next month"
      >
        &rarr;
      </button>
    </div>
  );
}
