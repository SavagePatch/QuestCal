"use client";

interface Campaign {
  id: string;
  name: string;
}

interface CampaignSelectProps {
  campaigns: Campaign[];
  value: string; // "" = all campaigns
  onChange: (campaignId: string) => void;
}

export default function CampaignSelect({ campaigns, value, onChange }: CampaignSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
    >
      <option value="">All Campaigns</option>
      {campaigns.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
