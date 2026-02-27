export const TIME_BLOCKS = {
  morning: { label: "Morning", start: 6, end: 12, order: 0 },
  afternoon: { label: "Afternoon", start: 12, end: 17, order: 1 },
  evening: { label: "Evening", start: 17, end: 22, order: 2 },
  late_night: { label: "Late Night", start: 22, end: 26, order: 3 }, // 26 = 2 AM next day
} as const;

export type TimeBlockKey = keyof typeof TIME_BLOCKS;
export type AvailabilityStatus = "yes" | "no" | "maybe";

export const STATUS_COLORS = {
  yes: { bg: "bg-emerald-500", text: "text-white", label: "Available" },
  maybe: { bg: "bg-amber-400", text: "text-black", label: "Maybe" },
  no: { bg: "bg-gray-200", text: "text-gray-500", label: "Unavailable" },
} as const;
