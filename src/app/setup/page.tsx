"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";

function getTimezones(): string[] {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    // Fallback for older environments
    return [
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "America/Anchorage",
      "Pacific/Honolulu",
      "America/Toronto",
      "America/Vancouver",
      "America/Sao_Paulo",
      "America/Argentina/Buenos_Aires",
      "America/Mexico_City",
      "Europe/London",
      "Europe/Paris",
      "Europe/Berlin",
      "Europe/Madrid",
      "Europe/Rome",
      "Europe/Amsterdam",
      "Europe/Moscow",
      "Europe/Istanbul",
      "Asia/Tokyo",
      "Asia/Shanghai",
      "Asia/Seoul",
      "Asia/Singapore",
      "Asia/Kolkata",
      "Asia/Dubai",
      "Asia/Bangkok",
      "Asia/Hong_Kong",
      "Australia/Sydney",
      "Australia/Melbourne",
      "Australia/Perth",
      "Pacific/Auckland",
      "Africa/Cairo",
      "Africa/Johannesburg",
      "Africa/Lagos",
    ];
  }
}

export default function SetupPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const sessionName = session?.user?.name ?? "";
  const [nameOverride, setNameOverride] = useState<string | null>(null);
  const name = nameOverride ?? sessionName;
  const [timezone, setTimezone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const allTimezones = useMemo(() => getTimezones(), []);

  const filteredTimezones = useMemo(() => {
    if (!search) return allTimezones;
    const lower = search.toLowerCase();
    return allTimezones.filter((tz) => tz.toLowerCase().includes(lower));
  }, [search, allTimezones]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !timezone) return;

    setLoading(true);
    const res = await fetch("/api/user/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, timezone }),
    });

    if (res.ok) {
      await update({ name, timezone });
      router.push("/dashboard");
    } else {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome to QuestCal</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Confirm your name and timezone to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Display Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setNameOverride(e.target.value)}
              required
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>

          <div className="relative">
            <label
              htmlFor="timezone"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Timezone
            </label>
            <input
              id="timezone"
              type="text"
              value={showDropdown ? search : timezone}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => {
                setSearch("");
                setShowDropdown(true);
              }}
              onBlur={() => {
                // Delay to allow click on dropdown item
                setTimeout(() => setShowDropdown(false), 200);
              }}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
            />
            {showDropdown && (
              <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-zinc-300 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                {filteredTimezones.map((tz) => (
                  <button
                    key={tz}
                    type="button"
                    className={`w-full px-3 py-1.5 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                      tz === timezone
                        ? "bg-zinc-100 font-medium dark:bg-zinc-800"
                        : ""
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setTimezone(tz);
                      setSearch("");
                      setShowDropdown(false);
                    }}
                  >
                    {tz}
                  </button>
                ))}
                {filteredTimezones.length === 0 && (
                  <p className="px-3 py-2 text-sm text-zinc-500">
                    No matching timezones
                  </p>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !name || !timezone}
            className="w-full rounded-md bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
