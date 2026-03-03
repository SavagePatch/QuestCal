"use client";

import { TIME_BLOCKS } from "@/lib/constants";
import type { TimeBlockKey } from "@/lib/constants";
import { useState } from "react";

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

interface CampaignCardProps {
  campaign: Campaign;
  allPlayers: Member[];
  onSessionCreated: (campaignId: string, session: GameSession) => void;
  onSessionUpdated: (campaignId: string, session: GameSession) => void;
  onSessionDeleted: (campaignId: string, sessionId: string) => void;
  onCampaignUpdated: (campaign: { id: string; name: string; description: string | null }) => void;
  onCampaignDeleted: (campaignId: string) => void;
  onMemberAdded: (campaignId: string, member: Member) => void;
  onMemberRemoved: (campaignId: string, userId: string) => void;
}

const blockKeys = Object.keys(TIME_BLOCKS) as TimeBlockKey[];

export default function CampaignCard({
  campaign,
  allPlayers,
  onSessionCreated,
  onSessionUpdated,
  onSessionDeleted,
  onCampaignUpdated,
  onCampaignDeleted,
  onMemberAdded,
  onMemberRemoved,
}: CampaignCardProps) {
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [editingSession, setEditingSession] = useState<GameSession | null>(null);
  const [date, setDate] = useState("");
  const [timeBlock, setTimeBlock] = useState<TimeBlockKey>("evening");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [sessionLoading, setSessionLoading] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(campaign.name);
  const [editDesc, setEditDesc] = useState(campaign.description ?? "");
  const [editLoading, setEditLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const memberIds = new Set(campaign.members.map((m) => m.id));
  const availablePlayers = allPlayers.filter((p) => !memberIds.has(p.id));

  async function handleSaveCampaign() {
    if (!editName.trim()) return;
    setEditLoading(true);
    const res = await fetch(`/api/campaigns/${campaign.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, description: editDesc }),
    });
    if (res.ok) {
      const updated = await res.json();
      onCampaignUpdated(updated);
      setEditing(false);
    }
    setEditLoading(false);
  }

  async function handleDeleteCampaign() {
    const res = await fetch(`/api/campaigns/${campaign.id}`, { method: "DELETE" });
    if (res.ok) onCampaignDeleted(campaign.id);
  }

  async function handleAddMember(userId: string) {
    setAddingMember(true);
    const res = await fetch(`/api/campaigns/${campaign.id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      const member = await res.json();
      onMemberAdded(campaign.id, member);
    }
    setAddingMember(false);
  }

  async function handleRemoveMember(userId: string) {
    setRemovingMemberId(userId);
    const res = await fetch(`/api/campaigns/${campaign.id}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) onMemberRemoved(campaign.id, userId);
    setRemovingMemberId(null);
  }

  function openCreateSession() {
    setEditingSession(null);
    setDate(""); setTimeBlock("evening"); setTitle(""); setNotes("");
    setShowSessionForm(true);
  }

  function openEditSession(s: GameSession) {
    setEditingSession(s);
    setDate(s.date); setTimeBlock(s.timeBlock as TimeBlockKey);
    setTitle(s.title ?? ""); setNotes(s.notes ?? "");
    setShowSessionForm(true);
  }

  async function handleSessionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;
    setSessionLoading(true);
    if (editingSession) {
      const res = await fetch(`/api/sessions/${editingSession.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, timeBlock, title: title || null, notes: notes || null }),
      });
      if (res.ok) { onSessionUpdated(campaign.id, await res.json()); setShowSessionForm(false); setEditingSession(null); }
    } else {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: campaign.id, date, timeBlock, title: title || undefined, notes: notes || undefined }),
      });
      if (res.ok) { onSessionCreated(campaign.id, await res.json()); setShowSessionForm(false); }
    }
    setSessionLoading(false);
  }

  async function handleDeleteSession(sessionId: string) {
    setDeletingSessionId(sessionId);
    const res = await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
    if (res.ok) onSessionDeleted(campaign.id, sessionId);
    setDeletingSessionId(null);
  }

  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
      {editing ? (
        <div className="space-y-2">
          <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-lg font-semibold focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900" />
          <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Description (optional)" className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900" />
          <div className="flex gap-2">
            <button onClick={handleSaveCampaign} disabled={editLoading} className="rounded-md bg-zinc-900 px-3 py-1 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200">{editLoading ? "Saving..." : "Save"}</button>
            <button onClick={() => setEditing(false)} className="rounded-md border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">{campaign.name}</h3>
            {campaign.description && <p className="mt-1 text-sm text-zinc-500">{campaign.description}</p>}
          </div>
          <div className="flex gap-1">
            <button onClick={() => { setEditName(campaign.name); setEditDesc(campaign.description ?? ""); setEditing(true); }} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300" title="Edit campaign">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z" /></svg>
            </button>
            {confirmDelete ? (
              <span className="flex items-center gap-1 text-xs">
                <button onClick={handleDeleteCampaign} className="rounded bg-red-500 px-2 py-0.5 text-white hover:bg-red-600">Confirm</button>
                <button onClick={() => setConfirmDelete(false)} className="rounded border border-zinc-300 px-2 py-0.5 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">No</button>
              </span>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950" title="Delete campaign">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Members */}
      <div className="mt-3">
        <h4 className="text-xs font-medium uppercase text-zinc-400">Players</h4>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {campaign.members.map((m) => (
            <span key={m.id} className="group flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {m.name}
              <button onClick={() => handleRemoveMember(m.id)} disabled={removingMemberId === m.id} className="hidden rounded-full text-zinc-400 hover:text-red-500 group-hover:inline-block" title="Remove">&times;</button>
            </span>
          ))}
          {campaign.members.length === 0 && <span className="text-xs text-zinc-400">No players yet</span>}
          {availablePlayers.length > 0 && (
            <select value="" onChange={(e) => { if (e.target.value) handleAddMember(e.target.value); }} disabled={addingMember} className="rounded-full border border-dashed border-zinc-300 bg-transparent px-2 py-0.5 text-xs text-zinc-500 hover:border-zinc-400 focus:outline-none dark:border-zinc-600">
              <option value="">+ Add player</option>
              {availablePlayers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Sessions */}
      {campaign.sessions.length > 0 && (
        <div className="mt-3">
          <h4 className="text-xs font-medium uppercase text-zinc-400">Upcoming Sessions</h4>
          <ul className="mt-1 space-y-1">
            {campaign.sessions.map((s) => (
              <li key={s.id} className="group flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <span className="font-medium">{s.date}</span>
                <span className="text-zinc-400">&middot;</span>
                <span>{TIME_BLOCKS[s.timeBlock as TimeBlockKey]?.label ?? s.timeBlock}</span>
                {s.title && (<><span className="text-zinc-400">&middot;</span><span>{s.title}</span></>)}
                <span className="ml-auto flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => openEditSession(s)} className="rounded px-1.5 py-0.5 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300">Edit</button>
                  <button onClick={() => handleDeleteSession(s.id)} disabled={deletingSessionId === s.id} className="rounded px-1.5 py-0.5 text-xs text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:hover:bg-red-950">{deletingSessionId === s.id ? "..." : "Delete"}</button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Session form */}
      <div className="mt-4">
        {showSessionForm ? (
          <form onSubmit={handleSessionSubmit} className="space-y-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
            <div className="mb-2 text-sm font-medium">{editingSession ? "Edit Session" : "Schedule Session"}</div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-zinc-500">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900" />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-zinc-500">Time Block</label>
                <select value={timeBlock} onChange={(e) => setTimeBlock(e.target.value as TimeBlockKey)} className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900">
                  {blockKeys.map((key) => <option key={key} value={key}>{TIME_BLOCKS[key].label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Title (optional)</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Session 12: The Amber Temple" className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Notes (optional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={sessionLoading} className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200">{sessionLoading ? (editingSession ? "Saving..." : "Scheduling...") : (editingSession ? "Save" : "Schedule")}</button>
              <button type="button" onClick={() => { setShowSessionForm(false); setEditingSession(null); }} className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">Cancel</button>
            </div>
          </form>
        ) : (
          <button onClick={openCreateSession} className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">Schedule Session</button>
        )}
      </div>
    </div>
  );
}
