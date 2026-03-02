export const TIME_BLOCKS = {
  morning: { label: "Morning", start: 6, end: 12, order: 0 },
  afternoon: { label: "Afternoon", start: 12, end: 17, order: 1 },
  evening: { label: "Evening", start: 17, end: 22, order: 2 },
  late_night: { label: "Late Night", start: 22, end: 26, order: 3 }, // 26 = 2 AM next day
} as const;

export type TimeBlockKey = keyof typeof TIME_BLOCKS;
export type AvailabilityStatus = "yes" | "no" | "maybe";
export type AvailabilityMode = "in_person" | "online" | "either";

export const ALL_BLOCK_KEYS: TimeBlockKey[] = ["morning", "afternoon", "evening", "late_night"];

export function formatTimeRange(start: number, end: number): string {
  const fmt = (h: number) => {
    const hour = h % 24;
    if (hour === 0) return "12am";
    if (hour === 12) return "12pm";
    return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
  };
  return `${fmt(start)}\u2013${fmt(end)}`;
}

export const MODE_LABELS: Record<AvailabilityMode, string> = {
  in_person: "In-Person",
  online: "Online",
  either: "Either",
};

// Colors per mode × status for the availability grid
export const MODE_STATUS_COLORS: Record<
  AvailabilityMode,
  Record<"yes" | "maybe", { bg: string; text: string; label: string }>
> = {
  in_person: {
    yes: { bg: "bg-emerald-500", text: "text-white", label: "Available (In-Person)" },
    maybe: { bg: "bg-emerald-300", text: "text-emerald-900", label: "Maybe (In-Person)" },
  },
  online: {
    yes: { bg: "bg-blue-500", text: "text-white", label: "Available (Online)" },
    maybe: { bg: "bg-blue-300", text: "text-blue-900", label: "Maybe (Online)" },
  },
  either: {
    yes: { bg: "bg-violet-500", text: "text-white", label: "Available (Either)" },
    maybe: { bg: "bg-violet-300", text: "text-violet-900", label: "Maybe (Either)" },
  },
};

export const STATUS_COLORS = {
  yes: { bg: "bg-emerald-500", text: "text-white", label: "Available" },
  maybe: { bg: "bg-amber-400", text: "text-black", label: "Maybe" },
  no: { bg: "bg-gray-200", text: "text-gray-500", label: "Unavailable" },
} as const;
