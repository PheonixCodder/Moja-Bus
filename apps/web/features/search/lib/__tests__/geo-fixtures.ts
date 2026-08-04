/**
 * Test fixtures mirroring packages/db/prisma/seed.ts — the Côte d'Ivoire city /
 * municipality / quarter dataset. Only Abidjan has real municipalities with
 * quarters; every other city gets a single pass-through municipality named
 * after the city itself.
 */

export const seedCities = [
  { name: "Abidjan", isMajorHub: true },
  { name: "Bouaké", isMajorHub: true },
  { name: "Yamoussoukro", isMajorHub: true },
  { name: "San-Pédro", isMajorHub: true },
  { name: "Daloa", isMajorHub: true },
  { name: "Korhogo", isMajorHub: true },
  { name: "Man", isMajorHub: true },
  { name: "Gagnoa", isMajorHub: false },
  { name: "Divo", isMajorHub: false },
  { name: "Soubré", isMajorHub: false },
  { name: "Abengourou", isMajorHub: false },
  { name: "Duekoué", isMajorHub: false },
  { name: "Odienné", isMajorHub: false },
  { name: "Bondoukou", isMajorHub: false },
  { name: "Séguéla", isMajorHub: false },
  { name: "Dimbokro", isMajorHub: false },
  { name: "Dabou", isMajorHub: false },
  { name: "Sassandra", isMajorHub: false },
  { name: "Touba", isMajorHub: false },
  { name: "Katiola", isMajorHub: false },
  { name: "Ferkéssédougou", isMajorHub: false },
  { name: "Bangolo", isMajorHub: false },
  { name: "Guiglo", isMajorHub: false },
  { name: "Issia", isMajorHub: false },
  { name: "Tiassalé", isMajorHub: false },
  { name: "Lakota", isMajorHub: false },
  { name: "Aboisso", isMajorHub: false },
  { name: "Adzopé", isMajorHub: false },
  { name: "Grand-Bassam", isMajorHub: false },
  { name: "Agboville", isMajorHub: false },
] as const;

/** Abidjan's municipalities and their quarters (from the seed). */
export const seedAbidjanMunicipalities: {
  name: string;
  quarters: string[];
}[] = [
  {
    name: "Abobo",
    quarters: [
      "Abobo Baoule",
      "Abobo Sagbe",
      "Abobo Te",
      "Agbekoi",
      "Anonkoi 2",
      "Gare Abobo",
    ],
  },
  {
    name: "Adjamé",
    quarters: [
      "Adjamé Liberté",
      "Adjamé village",
      "Anador",
      "Attié",
      "Djinou",
      "Monsieur",
    ],
  },
  {
    name: "Attécoubé",
    quarters: [
      "Abia",
      "Agbo",
      "Ahongbon",
      "Attecoube Centre",
      "Baco",
      "Camp Militaire",
      "Dogosso",
      "Gare Attecoube",
    ],
  },
  {
    name: "Cocody",
    quarters: [
      "Angré",
      "Blokosso",
      "Bonie",
      "Cocody Centre",
      "Danga",
      "Deux-Plateaux",
      "M'Badon",
      "Palmeraie",
      "Riviera 2",
      "Riviera 3",
      "Riviera 4",
      "Saint-Jean",
    ],
  },
  {
    name: "Koumassi",
    quarters: [
      "Koumassi Campement",
      "Koumassi Gare",
      "Koumassi Marché",
      "Koumassi Nord",
      "Koumassi Remblais",
      "Koumassi Sud",
      "Petite Koumassi",
    ],
  },
  {
    name: "Marcory",
    quarters: [
      "Anoumabo",
      "Marcory Avenue 3",
      "Marcory Gare",
      "Marcory Nord",
      "Marcory Sud",
      "Marcory Zone 4",
    ],
  },
  {
    name: "Plateau",
    quarters: ["Le Plateau", "Plateau Centre", "Plateau Gare", "Plateau Nord"],
  },
  {
    name: "Port-Bouët",
    quarters: [
      "Abidjan Port",
      "Gare Port-Bouet",
      "Koumassi Port",
      "Port Bouet Centre",
      "Vridi",
      "Vridi Gare",
    ],
  },
  {
    name: "Treichville",
    quarters: [
      "Belleville",
      "Djelan",
      "Ficgayo",
      "Gare Treichville",
      "Mobidoum",
      "Treichville Centre",
    ],
  },
  {
    name: "Yopougon",
    quarters: [
      "Andokoi",
      "Ayé",
      "Bel Air",
      "Camp Militaire",
      "Gare Yopougon",
      "Koute",
      "Nianguan",
      "Niangon",
      "Niangon Adiaho",
      "Selmer",
      "Sicogi",
      "Sodeci",
      "Toit Rouge",
      "Yopougon Centre",
    ],
  },
  {
    name: "Anyama",
    quarters: ["Anyama Centre", "Anyama Gare", "Anyama Nord"],
  },
  {
    name: "Bingerville",
    quarters: ["Bingerville Centre", "Bingerville Gare"],
  },
  {
    name: "Brodoukou",
    quarters: ["Brodoukou Centre"],
  },
];

/** All cities EXCEPT Abidjan receive a single pass-through municipality. */
export const seedPassThroughCities = seedCities.filter(
  (c) => c.name !== "Abidjan",
);
