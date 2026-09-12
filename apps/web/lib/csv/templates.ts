import { stringifyCsv } from "./parser";
import type { CsvTemplateConfig } from "./types";

export const TERMINALS_CSV_TEMPLATE: CsvTemplateConfig = {
  id: "terminals",
  entityName: "Terminal",
  filename: "moja-terminals-template.csv",
  columns: [
    {
      key: "name",
      label: "Terminal Name",
      required: true,
      description: "Official name of the terminal or depot",
      aliases: ["name", "terminal", "terminal name", "nom", "gare"],
      exampleValue: "Gare Centrale Adjamé",
      type: "string",
    },
    {
      key: "city",
      label: "City",
      required: true,
      description:
        "City name in Côte d'Ivoire (e.g. Abidjan, Bouaké, Yamoussoukro)",
      aliases: ["city", "ville", "commune", "town"],
      exampleValue: "Abidjan",
      type: "string",
    },
    {
      key: "addressLine1",
      label: "Address",
      required: true,
      description: "Street address or landmark description",
      aliases: ["address", "addressline1", "adresse", "rue", "localisation"],
      exampleValue: "Boulevard Nangui Abrogoua, face marché",
      type: "string",
    },
    {
      key: "phone",
      label: "Contact Phone",
      required: true,
      description: "Official phone number with country code",
      aliases: ["phone", "telephone", "contact", "tel", "numero"],
      exampleValue: "+2250700000001",
      type: "string",
    },
    {
      key: "isTerminal",
      label: "Is Passenger Terminal",
      required: false,
      description: "TRUE if passenger station, FALSE if back-office depot",
      aliases: ["isterminal", "is terminal", "terminal voyageur", "station"],
      exampleValue: "TRUE",
      type: "boolean",
    },
    {
      key: "managerName",
      label: "Manager Name",
      required: false,
      description: "Station manager or contact person name",
      aliases: ["manager", "manager name", "responsable", "chef de gare"],
      exampleValue: "Amadou Koné",
      type: "string",
    },
    {
      key: "managerPhone",
      label: "Manager Phone",
      required: false,
      description: "Station manager direct phone number",
      aliases: ["manager phone", "tel responsable", "direct line"],
      exampleValue: "+2250500000002",
      type: "string",
    },
    {
      key: "latitude",
      label: "Latitude",
      required: false,
      description: "GPS Latitude in decimal degrees",
      aliases: ["lat", "latitude", "gps lat"],
      exampleValue: "5.3582",
      type: "number",
    },
    {
      key: "longitude",
      label: "Longitude",
      required: false,
      description: "GPS Longitude in decimal degrees",
      aliases: ["lon", "lng", "longitude", "gps lon"],
      exampleValue: "-4.0267",
      type: "number",
    },
  ],
  sampleRows: [
    {
      name: "Gare Centrale Adjamé",
      city: "Abidjan",
      addressLine1: "Boulevard Nangui Abrogoua",
      phone: "+2250700000001",
      isTerminal: "TRUE",
      managerName: "Amadou Koné",
      managerPhone: "+2250500000002",
      latitude: "5.3582",
      longitude: "-4.0267",
    },
    {
      name: "Gare Routière Bouaké",
      city: "Bouaké",
      addressLine1: "Quartier Commerce, face grande mosquée",
      phone: "+2250700000003",
      isTerminal: "TRUE",
      managerName: "Kouassi Yao",
      managerPhone: "+2250500000004",
      latitude: "7.6905",
      longitude: "-5.0300",
    },
  ],
};

export const FLEET_CSV_TEMPLATE: CsvTemplateConfig = {
  id: "fleet",
  entityName: "Bus",
  filename: "moja-fleet-template.csv",
  columns: [
    {
      key: "registrationPlate",
      label: "License Plate",
      required: true,
      description:
        "Official vehicle registration number / plaque d'immatriculation",
      aliases: [
        "plate",
        "license plate",
        "registration",
        "immatriculation",
        "plaque",
      ],
      exampleValue: "1234-HJ-01",
      type: "string",
    },
    {
      key: "internalName",
      label: "Fleet Call Name / Number",
      required: false,
      description:
        "Operator internal vehicle identifier (e.g. Bus 101, VIP Express 1)",
      aliases: [
        "internal name",
        "fleet number",
        "callsign",
        "numero interne",
        "nom interne",
      ],
      exampleValue: "Bus 101",
      type: "string",
    },
    {
      key: "seatClass",
      label: "Seat Class",
      required: false,
      description: "STANDARD or VIP",
      aliases: ["seat class", "class", "classe", "categorie"],
      exampleValue: "STANDARD",
      type: "enum",
      options: ["STANDARD", "VIP", "ECONOMY"],
    },
    {
      key: "manufactureYear",
      label: "Manufacture Year",
      required: false,
      description: "Year the bus was manufactured",
      aliases: ["year", "manufacture year", "annee", "annee fabrication"],
      exampleValue: "2023",
      type: "number",
    },
    {
      key: "status",
      label: "Status",
      required: false,
      description: "ACTIVE, MAINTENANCE, or RETIRED",
      aliases: ["status", "etat", "statut"],
      exampleValue: "ACTIVE",
      type: "enum",
      options: ["ACTIVE", "MAINTENANCE", "RETIRED"],
    },
    {
      key: "notes",
      label: "Notes",
      required: false,
      description: "Operational notes or maintenance comments",
      aliases: ["notes", "commentaires", "description"],
      exampleValue: "Equipped with AC and USB chargers",
      type: "string",
    },
  ],
  sampleRows: [
    {
      registrationPlate: "1234-HJ-01",
      internalName: "Coach Alpha 01",
      seatClass: "STANDARD",
      manufactureYear: "2023",
      status: "ACTIVE",
      notes: "49 passenger seats, fully air-conditioned",
    },
    {
      registrationPlate: "5678-KL-01",
      internalName: "VIP Shuttle 02",
      seatClass: "VIP",
      manufactureYear: "2024",
      status: "ACTIVE",
      notes: "32 reclinable VIP seats with WiFi",
    },
  ],
};

export const ROUTES_CSV_TEMPLATE: CsvTemplateConfig = {
  id: "routes",
  entityName: "Route",
  filename: "moja-routes-template.csv",
  columns: [
    {
      key: "name",
      label: "Route Name",
      required: true,
      description: "Display name of corridor (e.g. Abidjan - Bouaké Express)",
      aliases: ["name", "route name", "nom", "ligne", "corridor"],
      exampleValue: "Abidjan – Bouaké Express",
      type: "string",
    },
    {
      key: "originTerminal",
      label: "Origin Terminal Name",
      required: true,
      description:
        "Name of the starting terminal (must match existing terminal)",
      aliases: ["origin", "origin terminal", "depart", "gare depart", "source"],
      exampleValue: "Gare Centrale Adjamé",
      type: "string",
    },
    {
      key: "destTerminal",
      label: "Destination Terminal Name",
      required: true,
      description:
        "Name of the arrival terminal (must match existing terminal)",
      aliases: [
        "destination",
        "dest terminal",
        "arrivee",
        "gare arrivee",
        "terminus",
      ],
      exampleValue: "Gare Routière Bouaké",
      type: "string",
    },
    {
      key: "distanceKm",
      label: "Distance (KM)",
      required: false,
      description: "Total corridor route distance in kilometers",
      aliases: ["distance", "distance km", "km", "kilometrage"],
      exampleValue: "348",
      type: "number",
    },
    {
      key: "turnaroundBufferMinutes",
      label: "Turnaround Rest (Minutes)",
      required: false,
      description:
        "Driver rest and bus cleaning turnaround buffer in minutes (default 45)",
      aliases: ["turnaround", "buffer", "temps repos", "pause"],
      exampleValue: "45",
      type: "number",
    },
  ],
  sampleRows: [
    {
      name: "Abidjan – Bouaké Express",
      originTerminal: "Gare Centrale Adjamé",
      destTerminal: "Gare Routière Bouaké",
      distanceKm: "348",
      turnaroundBufferMinutes: "45",
    },
    {
      name: "Abidjan – Yamoussoukro Direct",
      originTerminal: "Gare Centrale Adjamé",
      destTerminal: "Gare Yamoussoukro Centre",
      distanceKm: "240",
      turnaroundBufferMinutes: "45",
    },
  ],
};

export const SCHEDULES_CSV_TEMPLATE: CsvTemplateConfig = {
  id: "schedules",
  entityName: "Schedule",
  filename: "moja-schedules-template.csv",
  columns: [
    {
      key: "routeName",
      label: "Route Name",
      required: true,
      description:
        "Name of the route (must match an existing route in your account)",
      aliases: ["route", "route name", "ligne", "corridor", "nom de ligne"],
      exampleValue: "Abidjan – Bouaké Express",
      type: "string",
    },
    {
      key: "departureTime",
      label: "Departure Time (HH:mm)",
      required: true,
      description: "Departure time in 24h format (e.g. 06:00, 14:30)",
      aliases: ["departure", "departure time", "heure", "heure depart", "time"],
      exampleValue: "06:00",
      type: "string",
    },
    {
      key: "operatingDays",
      label: "Operating Days",
      required: false,
      description:
        "DAILY, WEEKDAYS, WEEKENDS, or comma-separated days: Mon,Tue,Wed,Thu,Fri,Sat,Sun",
      aliases: [
        "days",
        "operating days",
        "recurrence",
        "jours",
        "jours circulation",
      ],
      exampleValue: "DAILY",
      type: "string",
    },
    {
      key: "baseFareXOF",
      label: "Fare (XOF)",
      required: true,
      description: "Origin-to-Destination passenger ticket price in CFA Francs",
      aliases: ["fare", "price", "prix", "tarif", "montant"],
      exampleValue: "6000",
      type: "number",
    },
    {
      key: "durationMinutes",
      label: "Estimated Duration (Minutes)",
      required: true,
      description: "Trip travel duration in minutes (e.g. 240 for 4 hours)",
      aliases: ["duration", "duration minutes", "duree", "temps trajet"],
      exampleValue: "240",
      type: "number",
    },
    {
      key: "preferredBusPlate",
      label: "Preferred Bus Plate",
      required: false,
      description: "License plate of assigned default vehicle (optional)",
      aliases: ["bus", "preferred bus", "bus plate", "plaque bus", "vehicule"],
      exampleValue: "1234-HJ-01",
      type: "string",
    },
    {
      key: "scheduleName",
      label: "Schedule Name",
      required: false,
      description: "Marketing or operational name (e.g. Morning Express)",
      aliases: ["schedule name", "service name", "nom service"],
      exampleValue: "Morning Express 1",
      type: "string",
    },
  ],
  sampleRows: [
    {
      routeName: "Abidjan – Bouaké Express",
      departureTime: "06:00",
      operatingDays: "DAILY",
      baseFareXOF: "6000",
      durationMinutes: "240",
      preferredBusPlate: "1234-HJ-01",
      scheduleName: "Morning Express",
    },
    {
      routeName: "Abidjan – Bouaké Express",
      departureTime: "14:00",
      operatingDays: "DAILY",
      baseFareXOF: "6000",
      durationMinutes: "240",
      preferredBusPlate: "5678-KL-01",
      scheduleName: "Afternoon Express",
    },
  ],
};

export const CSV_TEMPLATES: Record<string, CsvTemplateConfig> = {
  terminals: TERMINALS_CSV_TEMPLATE,
  fleet: FLEET_CSV_TEMPLATE,
  routes: ROUTES_CSV_TEMPLATE,
  schedules: SCHEDULES_CSV_TEMPLATE,
};

/**
 * Generates a downloadable CSV string for a template with headers and sample data.
 */
export function generateSampleCsv(config: CsvTemplateConfig): string {
  const headers = config.columns.map((c) => c.label);
  const rows = config.sampleRows.map((sample) => {
    return config.columns.map((col) => sample[col.key] ?? "");
  });
  return stringifyCsv(headers, rows);
}

/**
 * Helper to trigger browser download of a CSV file.
 */
export function downloadCsvFile(filename: string, csvContent: string): void {
  const blob = new Blob([`\uFEFF${csvContent}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
