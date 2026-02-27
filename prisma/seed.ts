import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

const TIME_BLOCKS = ["morning", "afternoon", "evening", "late_night"] as const;

function randomStatus(): "yes" | "maybe" | null {
  const roll = Math.random();
  if (roll < 0.35) return "yes";
  if (roll < 0.55) return "maybe";
  return null; // "no" — don't store a record
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function formatDate(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

async function main() {
  // Clear existing data
  await prisma.notification.deleteMany();
  await prisma.gameSessionPlayer.deleteMany();
  await prisma.gameSession.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.campaignMembership.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.authSession.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  const defaultPassword = hashSync("password123", 10);

  // Create GM user
  const gm = await prisma.user.create({
    data: {
      name: "Quest Master",
      email: "gm@questcal.dev",
      passwordHash: defaultPassword,
      timezone: "America/New_York",
      isGM: true,
    },
  });

  // Create 6 player users with varied timezones
  const playerData = [
    { name: "Alice Ranger", email: "alice@questcal.dev", timezone: "America/New_York" },
    { name: "Bob Wizard", email: "bob@questcal.dev", timezone: "America/Chicago" },
    { name: "Charlie Rogue", email: "charlie@questcal.dev", timezone: "America/Denver" },
    { name: "Diana Cleric", email: "diana@questcal.dev", timezone: "America/Los_Angeles" },
    { name: "Erik Bard", email: "erik@questcal.dev", timezone: "Europe/London" },
    { name: "Fumiko Monk", email: "fumiko@questcal.dev", timezone: "Asia/Tokyo" },
  ];

  const players = [];
  for (const data of playerData) {
    const player = await prisma.user.create({
      data: {
        ...data,
        passwordHash: defaultPassword,
        isGM: false,
      },
    });
    players.push(player);
  }

  // Campaign 1: "Curse of Strahd" — GM + Alice, Bob, Charlie, Diana (4 players)
  const campaign1 = await prisma.campaign.create({
    data: {
      name: "Curse of Strahd",
      description: "A gothic horror adventure in the mists of Barovia.",
    },
  });

  const campaign1Players = [players[0], players[1], players[2], players[3]];
  for (const player of campaign1Players) {
    await prisma.campaignMembership.create({
      data: { userId: player.id, campaignId: campaign1.id },
    });
  }
  // GM is also a member
  await prisma.campaignMembership.create({
    data: { userId: gm.id, campaignId: campaign1.id },
  });

  // Campaign 2: "Tomb of Annihilation" — GM + Bob, Diana, Erik (3 players, Bob & Diana overlap)
  const campaign2 = await prisma.campaign.create({
    data: {
      name: "Tomb of Annihilation",
      description: "A deadly jungle expedition to stop a death curse.",
    },
  });

  const campaign2Players = [players[1], players[3], players[4]];
  for (const player of campaign2Players) {
    await prisma.campaignMembership.create({
      data: { userId: player.id, campaignId: campaign2.id },
    });
  }
  await prisma.campaignMembership.create({
    data: { userId: gm.id, campaignId: campaign2.id },
  });

  // Generate randomized availability for the current month for all players
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const daysInMonth = getDaysInMonth(year, month);

  const availabilityRecords: {
    userId: string;
    date: string;
    timeBlock: string;
    status: string;
  }[] = [];

  for (const player of players) {
    for (let day = 1; day <= daysInMonth; day++) {
      const date = formatDate(year, month, day);
      for (const block of TIME_BLOCKS) {
        const status = randomStatus();
        if (status) {
          availabilityRecords.push({
            userId: player.id,
            date,
            timeBlock: block,
            status,
          });
        }
      }
    }
  }

  // Batch insert availability
  if (availabilityRecords.length > 0) {
    await prisma.availability.createMany({
      data: availabilityRecords,
    });
  }

  // Print summary
  console.log("Seed completed successfully!");
  console.log(`  GM: ${gm.name} (${gm.email})`);
  console.log(`  Players: ${players.length}`);
  players.forEach((p) => console.log(`    - ${p.name} (${p.email}, ${p.timezone})`));
  console.log(`  Campaigns: 2`);
  console.log(`    - ${campaign1.name}: ${campaign1Players.length} players + GM`);
  console.log(`    - ${campaign2.name}: ${campaign2Players.length} players + GM`);
  console.log(`  Availability records: ${availabilityRecords.length}`);
  console.log(`  All users password: password123`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
