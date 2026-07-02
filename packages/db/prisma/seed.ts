import "dotenv/config";
import { getPrismaClient } from "../src/index.js";

const prisma = getPrismaClient();

async function main() {
  console.log("🌱 Seeding Moja Ride platform data...\n");

  // ============================================================
  // CITIES — Côte d'Ivoire only
  // Source: 2021 census + administrative districts
  // ============================================================
  console.log("📍 Seeding cities...");

  const cities = [
    // Major Hubs (isMajorHub = true)
    {
      name: "Abidjan",
      region: "Abidjan",
      district: "Abidjan",
      isMajorHub: true,
      latitude: 5.36,
      longitude: -4.0083,
    },
    {
      name: "Bouaké",
      region: "Vallée du Bandama",
      district: "Vallée du Bandama",
      isMajorHub: true,
      latitude: 7.6897,
      longitude: -5.0317,
    },
    {
      name: "Yamoussoukro",
      region: "Yamoussoukro",
      district: "Yamoussoukro",
      isMajorHub: true,
      latitude: 6.8276,
      longitude: -5.2893,
    },
    {
      name: "San-Pédro",
      region: "Bas-Sassandra",
      district: "Bas-Sassandra",
      isMajorHub: true,
      latitude: 4.7486,
      longitude: -6.6362,
    },
    {
      name: "Daloa",
      region: "Sassandra-Marahoué",
      district: "Sassandra-Marahoué",
      isMajorHub: true,
      latitude: 6.8774,
      longitude: -6.4502,
    },
    {
      name: "Korhogo",
      region: "Poro",
      district: "Savanes",
      isMajorHub: true,
      latitude: 9.4581,
      longitude: -5.6296,
    },
    {
      name: "Man",
      region: "Tonkpi",
      district: "Montagnes",
      isMajorHub: true,
      latitude: 7.4126,
      longitude: -7.5534,
    },

    // Secondary Cities
    {
      name: "Gagnoa",
      region: "Gôh",
      district: "Gôh-Djiboua",
      isMajorHub: false,
      latitude: 6.1319,
      longitude: -5.9506,
    },
    {
      name: "Divo",
      region: "Lôh-Djiboua",
      district: "Gôh-Djiboua",
      isMajorHub: false,
      latitude: 5.8369,
      longitude: -5.3575,
    },
    {
      name: "Soubré",
      region: "Nawa",
      district: "Bas-Sassandra",
      isMajorHub: false,
      latitude: 5.7856,
      longitude: -6.59,
    },
    {
      name: "Abengourou",
      region: "Indénié-Djuablin",
      district: "Comoé",
      isMajorHub: false,
      latitude: 6.7297,
      longitude: -3.4966,
    },
    {
      name: "Duekoué",
      region: "Guémon",
      district: "Montagnes",
      isMajorHub: false,
      latitude: 6.7428,
      longitude: -7.35,
    },
    {
      name: "Odienné",
      region: "Kabadougou",
      district: "Denguélé",
      isMajorHub: false,
      latitude: 9.5086,
      longitude: -7.5659,
    },
    {
      name: "Bondoukou",
      region: "Gontougo",
      district: "Zanzan",
      isMajorHub: false,
      latitude: 8.0401,
      longitude: -2.7999,
    },
    {
      name: "Séguéla",
      region: "Worodougou",
      district: "Woroba",
      isMajorHub: false,
      latitude: 7.9603,
      longitude: -6.6727,
    },
    {
      name: "Dimbokro",
      region: "N'Zi",
      district: "Lacs",
      isMajorHub: false,
      latitude: 6.6496,
      longitude: -4.7055,
    },
    {
      name: "Dabou",
      region: "Grands-Ponts",
      district: "Lagunes",
      isMajorHub: false,
      latitude: 5.3258,
      longitude: -4.377,
    },
    {
      name: "Sassandra",
      region: "Gbôklé",
      district: "Bas-Sassandra",
      isMajorHub: false,
      latitude: 4.9504,
      longitude: -6.084,
    },
    {
      name: "Touba",
      region: "Bafing",
      district: "Woroba",
      isMajorHub: false,
      latitude: 8.2833,
      longitude: -7.6833,
    },
    {
      name: "Katiola",
      region: "Hambol",
      district: "Vallée du Bandama",
      isMajorHub: false,
      latitude: 8.1333,
      longitude: -5.1,
    },
    {
      name: "Ferkéssédougou",
      region: "Hambol",
      district: "Savanes",
      isMajorHub: false,
      latitude: 9.5931,
      longitude: -5.1947,
    },
    {
      name: "Bangolo",
      region: "Guémon",
      district: "Montagnes",
      isMajorHub: false,
      latitude: 7.0128,
      longitude: -7.488,
    },
    {
      name: "Guiglo",
      region: "Cavally",
      district: "Montagnes",
      isMajorHub: false,
      latitude: 6.5426,
      longitude: -7.4882,
    },
    {
      name: "Issia",
      region: "Haut-Sassandra",
      district: "Sassandra-Marahoué",
      isMajorHub: false,
      latitude: 6.4833,
      longitude: -6.5833,
    },
    {
      name: "Tiassalé",
      region: "Agnéby-Tiassa",
      district: "Lagunes",
      isMajorHub: false,
      latitude: 5.8986,
      longitude: -4.8233,
    },
    {
      name: "Lakota",
      region: "Lôh-Djiboua",
      district: "Gôh-Djiboua",
      isMajorHub: false,
      latitude: 5.8501,
      longitude: -5.6832,
    },
    {
      name: "Aboisso",
      region: "Sud-Comoé",
      district: "Comoé",
      isMajorHub: false,
      latitude: 5.468,
      longitude: -3.209,
    },
    {
      name: "Adzopé",
      region: "La Mé",
      district: "Lagunes",
      isMajorHub: false,
      latitude: 6.1002,
      longitude: -3.867,
    },
    {
      name: "Grand-Bassam",
      region: "Sud-Comoé",
      district: "Comoé",
      isMajorHub: false,
      latitude: 5.2,
      longitude: -3.7333,
    },
    {
      name: "Agboville",
      region: "Agnéby-Tiassa",
      district: "Lagunes",
      isMajorHub: false,
      latitude: 5.9292,
      longitude: -4.215,
    },
  ];

  for (const city of cities) {
    await prisma.city.upsert({
      where: { name: city.name },
      update: city,
      create: { ...city, isActive: true },
    });
  }
  console.log(`   ✅ ${cities.length} cities seeded\n`);

  // ============================================================
  // BUS TYPES — Platform-managed vehicle models
  // ============================================================
  console.log("🚌 Seeding bus types...");

  const busTypes = [
    {
      name: "Toyota Coaster",
      description: "Standard 20-seat minibus. Most common in Côte d'Ivoire.",
    },
    {
      name: "Mercedes Sprinter",
      description: "15-seat luxury minibus. Used for VIP transfers.",
    },
    {
      name: "Yutong ZK6107",
      description: "47-seat full-size coach. Long-distance routes.",
    },
    {
      name: "Yutong ZK6127",
      description: "55-seat full-size coach. High-capacity routes.",
    },
    {
      name: "Higer KLQ6119",
      description: "49-seat coach. Popular with intercity operators.",
    },
    {
      name: "King Long XMQ6127",
      description: "55-seat luxury coach. VIP long-haul services.",
    },
    {
      name: "Toyota HiAce",
      description: '13-seat shared taxi minibus ("woro-woro" style).',
    },
  ];

  for (const bt of busTypes) {
    await prisma.busType.upsert({
      where: { name: bt.name },
      update: bt,
      create: { ...bt, isActive: true },
    });
  }
  console.log(`   ✅ ${busTypes.length} bus types seeded\n`);

  // ============================================================
  // SEAT LAYOUT TEMPLATES — Platform defaults per bus type
  // ============================================================
  console.log("💺 Seeding seat layout templates...");

  const coaster = await prisma.busType.findUniqueOrThrow({
    where: { name: "Toyota Coaster" },
  });
  const yutong107 = await prisma.busType.findUniqueOrThrow({
    where: { name: "Yutong ZK6107" },
  });
  const yutong127 = await prisma.busType.findUniqueOrThrow({
    where: { name: "Yutong ZK6127" },
  });
  const sprinter = await prisma.busType.findUniqueOrThrow({
    where: { name: "Mercedes Sprinter" },
  });

  // Helper to generate seat templates for a rows × cols grid
  function generateSeats(rows: number, cols: number, deck = 1) {
    const colLabels = ["A", "B", "C", "D", "E"];
    const templates = [];
    for (let r = 1; r <= rows; r++) {
      for (let c = 0; c < cols; c++) {
        const label = `${r}${colLabels[c]}`;
        const seatType =
          c === 0 || c === cols - 1
            ? "PASSENGER_WINDOW"
            : cols > 2 && c === Math.floor(cols / 2)
              ? "PASSENGER_AISLE"
              : "PASSENGER_MIDDLE";
        templates.push({
          row: r,
          col: c,
          deck,
          label,
          seatType: seatType as any,
          isBookable: true,
        });
      }
    }
    return templates;
  }

  const layouts = [
    {
      busTypeId: coaster.id,
      name: "Coaster Standard 22",
      totalSeats: 22,
      rows: 6,
      columns: 4,
      hasAC: false,
      hasLuggage: true,
    },
    {
      busTypeId: coaster.id,
      name: "Coaster VIP 18",
      totalSeats: 18,
      rows: 5,
      columns: 4,
      hasAC: true,
      hasLuggage: true,
    },
    {
      busTypeId: yutong107.id,
      name: "Coach 2+2 Standard 47",
      totalSeats: 47,
      rows: 12,
      columns: 4,
      hasAC: true,
      hasLuggage: true,
    },
    {
      busTypeId: yutong127.id,
      name: "Coach 2+3 Standard 55",
      totalSeats: 55,
      rows: 11,
      columns: 5,
      hasAC: true,
      hasLuggage: true,
    },
    {
      busTypeId: sprinter.id,
      name: "Sprinter VIP 15",
      totalSeats: 15,
      rows: 4,
      columns: 4,
      hasAC: true,
      hasLuggage: true,
    },
  ];

  for (const layout of layouts) {
    const existing = await prisma.seatLayoutTemplate.findFirst({
      where: { name: layout.name, companyId: null },
    });

    if (!existing) {
      const created = await prisma.seatLayoutTemplate.create({
        data: {
          ...layout,
          companyId: null,
          hasWifi: false,
          hasToilet: false,
          seatTemplates: {
            create: generateSeats(layout.rows, layout.columns),
          },
        },
      });
      console.log(`   ✅ Created layout: ${created.name}`);
    } else {
      console.log(`   ⏭️  Skipped (exists): ${layout.name}`);
    }
  }

  console.log("\n✨ Seed complete!\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
