import type { TimeBlockKey, AvailabilityStatus, AvailabilityMode } from "@/lib/constants";

export type { TimeBlockKey, AvailabilityStatus, AvailabilityMode };

export interface AvailabilityEntry {
  date: string; // "YYYY-MM-DD"
  timeBlock: TimeBlockKey;
  status: AvailabilityStatus;
  mode: AvailabilityMode;
}
