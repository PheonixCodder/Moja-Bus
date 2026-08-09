import "dotenv/config";
import { getPrismaClient } from "../src/index.js";
import { runIvoryCoastGeoImport } from "../scripts/import-ivory-coast-geo.js";

const prisma = getPrismaClient();

async function main() {
  console.log("🌱 Seeding Moja Ride platform data...\n");

  // ============================================================
  // GEOGRAPHY — Côte d'Ivoire
  // Cities, regions/districts, municipalities (communes) and quarters are
  // imported from the authoritative GeoJSON sources by the geo importer.
  // Single source of truth; no hand-written city list.
  // ============================================================
  console.log("🌍 Importing Côte d'Ivoire geography...");
  try {
    await runIvoryCoastGeoImport(prisma);
  } catch (e: any) {
    if (e?.code === "ENOENT") {
      console.log("   ℹ️  Raw GeoJSON files omitted from container — populate geography via `geo-seed.sql`.");
    } else {
      throw e;
    }
  }
  console.log("\n");

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
    const existing = await prisma.busType.findFirst({
      where: { companyId: null, name: bt.name },
    });
    if (!existing) {
      await prisma.busType.create({ data: { ...bt, isActive: true, companyId: null } });
    }
  }
  console.log(`   ✅ ${busTypes.length} bus types seeded\n`);

  // ============================================================
  // SEAT LAYOUT TEMPLATES — Platform defaults per bus type
  // ============================================================
  console.log("💺 Seeding seat layout templates...");

  const byName = (name: string) =>
    prisma.busType.findFirstOrThrow({ where: { companyId: null, name } });

  const coaster = await byName("Toyota Coaster");
  const yutong107 = await byName("Yutong ZK6107");
  const yutong127 = await byName("Yutong ZK6127");
  const sprinter = await byName("Mercedes Sprinter");
  const higer = await byName("Higer KLQ6119");
  const kingLong = await byName("King Long XMQ6127");
  const hiace = await byName("Toyota HiAce");

  function generateSeats(rows: number, cols: number, deck = 1) {
    const colLabels = ["A", "B", "C", "D", "E", "F"];
    const templates = [];

    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        let seatType = "PASSENGER_MIDDLE";
        let isBookable = true;
        let label = "";

        if (r === 1 && c === 1) {
          seatType = "DRIVER_AREA";
          isBookable = false;
          label = "DRV";
        } else if ((cols === 4 && c === 3) || (cols === 5 && c === 3)) {
          seatType = "EMPTY_SPACE";
          isBookable = false;
          label = "";
        } else {
          if (c === 1 || c === cols) {
            seatType = "PASSENGER_WINDOW";
          } else {
            seatType = "PASSENGER_AISLE";
          }
          label = `${r}${colLabels[c - 1]}`;
        }

        templates.push({
          row: r,
          col: c,
          deck,
          label,
          seatType: seatType as any,
          isBookable,
        });
      }
    }
    return templates;
  }

  const layouts = [
    {
      busTypeId: coaster.id,
      name: "Coaster Standard 22",
      seatClass: "STANDARD" as const,
      totalSeats: 22,
      rows: 6,
      columns: 4,
      hasAC: false,
      hasLuggage: true,
    },
    {
      busTypeId: coaster.id,
      name: "Coaster VIP 18",
      seatClass: "VIP" as const,
      totalSeats: 18,
      rows: 5,
      columns: 4,
      hasAC: true,
      hasLuggage: true,
    },
    {
      busTypeId: yutong107.id,
      name: "Coach 2+2 Standard 47",
      seatClass: "STANDARD" as const,
      totalSeats: 47,
      rows: 12,
      columns: 4,
      hasAC: true,
      hasLuggage: true,
    },
    {
      busTypeId: yutong127.id,
      name: "Coach 2+3 Standard 55",
      seatClass: "ECONOMY" as const,
      totalSeats: 55,
      rows: 11,
      columns: 5,
      hasAC: true,
      hasLuggage: true,
    },
    {
      busTypeId: sprinter.id,
      name: "Sprinter VIP 15",
      seatClass: "VIP" as const,
      totalSeats: 15,
      rows: 4,
      columns: 4,
      hasAC: true,
      hasLuggage: true,
    },
    {
      busTypeId: higer.id,
      name: "Higer Standard 49",
      seatClass: "STANDARD" as const,
      totalSeats: 49,
      rows: 13,
      columns: 4,
      hasAC: true,
      hasLuggage: true,
    },
    {
      busTypeId: kingLong.id,
      name: "King Long VIP 55",
      seatClass: "VIP" as const,
      totalSeats: 55,
      rows: 14,
      columns: 4,
      hasAC: true,
      hasWifi: true,
      hasToilet: true,
      hasLuggage: true,
    },
    {
      busTypeId: hiace.id,
      name: "HiAce Standard 13",
      seatClass: "STANDARD" as const,
      totalSeats: 13,
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
