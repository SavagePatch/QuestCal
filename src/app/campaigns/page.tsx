"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import CampaignCard from "@/components/CampaignCard";

interface GameSession {
  id: string;
  date: string;
  timeBlock: string;
  title: string | null;
  notes?: string | null;
  status: string;
}

interface Member {
  id: string;
  name: string;
}

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  members: Member[];
  sessions: GameSession[];
}

export default function CampaignsPage() {
  const { data: session, status } = useSession();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [allPlayers, setAllPlayers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.isGM) return;

    Promise.all([
      fetch("/api/campaigns").then((r) => r.json()),
      fetch("/api/players-list").then((r) => r.ok ? r.json() : []),
    ]).then(([campaignsData, playersData]) => {
      setCampaigns(campaignsData);
      setAllPlayers(playersData);
      setLoading(false);
    });
  }, [status, session?.user?.isGM]);

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, description: newDesc }),
    });
    if (res.ok) {
      const campaign = await res.json();
      setCampaigns((prev) => [...prev, campaign].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName(""); setNewDesc(""); setShowCreate(false);
    }
    setCreating(false);
  }

  function handleSessionCreated(campaignId: string, s: GameSession) {
    setCampaigns((prev) => prev.map((c) => c.id === campaignId ? { ...c, sessions: [...c.sessions, s].sort((a, b) => a.date.localeCompare(b.date)) } : c));
  }
  function handleSessionUpdated(campaignId: string, s: GameSession) {
    setCampaigns((prev) => prev.map((c) => c.id === campaignId ? { ...c, sessions: c.sessions.map((x) => x.id === s.id ? s : x).sort((a, b) => a.date.localeCompare(b.date)) } : c));
  }
  function handleSessionDeleted(campaignId: string, sessionId: string) {
    setCampaigns((prev) => prev.map((c) => c.id === campaignId ? { ...c, sessions: c.sessions.filter((s) => s.id !== sessionId) } : c));
  }
  function handleCampaignUpdated(updated: { id: string; name: string; description: string | null }) {
    setCampaigns((prev) => prev.map((c) => c.id === updated.id ? { ...c, name: updated.name, description: updated.description } : c));
  }
  function handleCampaignDeleted(campaignId: string) {
    setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
  }
  function handleMemberAdded(campaignId: string, member: Member) {
    setCampaigns((prev) => prev.map((c) => c.id === campaignId ? { ...c, members: [...c.members, member] } : c));
  }
  function handleMemberRemoved(campaignId: string, userId: string) {
    setCampaigns((prev) => prev.map((c) => c.id === campaignId ? { ...c, members: c.members.filter((m) => m.id !== userId) } : c));
  }

  if (status === "loading" || loading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-4 space-y-4">
          <div className="h-40 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-40 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        {!showCreate && (
          <button onClick={() => setShowCreate(true)} className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200">
            New Campaign
          </button>
        )}
      </div>

      {showCreate && (
        <form onSubmit={handleCreateCampaign} className="mb-6 space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
          <div className="text-sm font-medium">Create Campaign</div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Name</label>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder="e.g. Curse of Strahd" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Description (optional)</label>
            <input type="text" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="A gothic horror adventure..." className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={creating} className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200">{creating ? "Creating..." : "Create"}</button>
            <button type="button" onClick={() => { setShowCreate(false); setNewName(""); setNewDesc(""); }} className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">Cancel</button>
          </div>
        </form>
      )}

      {campaigns.length === 0 ? (
        <p className="text-zinc-500">No campaigns yet. Create one to get started!</p>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              allPlayers={allPlayers}
              onSessionCreated={handleSessionCreated}
              onSessionUpdated={handleSessionUpdated}
              onSessionDeleted={handleSessionDeleted}
              onCampaignUpdated={handleCampaignUpdated}
              onCampaignDeleted={handleCampaignDeleted}
              onMemberAdded={handleMemberAdded}
              onMemberRemoved={handleMemberRemoved}
            />
          ))}
        </div>
      )}
    </div>
  );
}
