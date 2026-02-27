import type { TimeBlockKey, AvailabilityStatus } from "@/lib/constants";

export type { TimeBlockKey, AvailabilityStatus };

export interface AvailabilityEntry {
  date: string; // "YYYY-MM-DD"
  timeBlock: TimeBlockKey;
  status: AvailabilityStatus;
}
