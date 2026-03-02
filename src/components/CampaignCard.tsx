"use client";

import { TIME_BLOCKS } from "@/lib/constants";
import type { TimeBlockKey } from "@/lib/constants";
import { useState } from "react";

interface Session {
  id: string;
  date: string;
  timeBlock: string;
  title: string | null;
  status: string;
}

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  members: { id: string; name: string }[];
  sessions: Session[];
}

interface CampaignCardProps {
  campaign: Campaign;
  onSessionCreated: (campaignId: string, session: Session) => void;
}

const blockKeys = Object.keys(TIME_BLOCKS) as TimeBlockKey[];

export default function CampaignCard({ campaign, onSessionCreated }: CampaignCardProps) {
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState("");
  const [timeBlock, setTimeBlock] = useState<TimeBlockKey>("evening");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;

    setLoading(true);
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaignId: campaign.id,
        date,
        timeBlock,
        title: title || undefined,
        notes: notes || undefined,
      }),
    });

    if (res.ok) {
      const session = await res.json();
      onSessionCreated(campaign.id, session);
      setShowForm(false);
      setDate("");
      setTitle("");
      setNotes("");
    }
    setLoading(false);
  }

  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
      <h3 className="text-lg font-semibold">{campaign.name}</h3>
      {campaign.description && (
        <p className="mt-1 text-sm text-zinc-500">{campaign.description}</p>
      )}

      <div className="mt-3">
        <h4 className="text-xs font-medium uppercase text-zinc-400">Players</h4>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {campaign.members.map((m) => (
            <span
              key={m.id}
              className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {m.name}
            </span>
          ))}
          {campaign.members.length === 0 && (
            <span className="text-xs text-zinc-400">No players</span>
          )}
        </div>
      </div>

      {campaign.sessions.length > 0 && (
        <div className="mt-3">
          <h4 className="text-xs font-medium uppercase text-zinc-400">
            Upcoming Sessions
          </h4>
          <ul className="mt-1 space-y-1">
            {campaign.sessions.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400"
              >
                <span className="font-medium">{s.date}</span>
                <span className="text-zinc-400">&middot;</span>
                <span>{TIME_BLOCKS[s.timeBlock as TimeBlockKey]?.label ?? s.timeBlock}</span>
                {s.title && (
                  <>
                    <span className="text-zinc-400">&middot;</span>
                    <span>{s.title}</span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4">
        {showForm ? (
          <form onSubmit={handleSubmit} className="space-y-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-zinc-500">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-zinc-500">Time Block</label>
                <select
                  value={timeBlock}
                  onChange={(e) => setTimeBlock(e.target.value as TimeBlockKey)}
                  className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                >
                  {blockKeys.map((key) => (
                    <option key={key} value={key}>
                      {TIME_BLOCKS[key].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">
                Title (optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Session 12: The Amber Temple"
                className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {loading ? "Scheduling..." : "Schedule"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Schedule Session
          </button>
        )}
      </div>
    </div>
  );
}
