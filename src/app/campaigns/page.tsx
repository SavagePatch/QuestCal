"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import CampaignCard from "@/components/CampaignCard";

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

export default function CampaignsPage() {
  const { data: session, status } = useSession();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.isGM) return;
    fetch("/api/campaigns")
      .then((res) => res.json())
      .then((data) => {
        setCampaigns(data);
        setLoading(false);
      });
  }, [status, session?.user?.isGM]);

  function handleSessionCreated(campaignId: string, newSession: Session) {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === campaignId
          ? { ...c, sessions: [...c.sessions, newSession].sort((a, b) => a.date.localeCompare(b.date)) }
          : c
      )
    );
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
      <h1 className="mb-6 text-2xl font-bold">Campaigns</h1>
      {campaigns.length === 0 ? (
        <p className="text-zinc-500">No campaigns found.</p>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onSessionCreated={handleSessionCreated}
            />
          ))}
        </div>
      )}
    </div>
  );
}
