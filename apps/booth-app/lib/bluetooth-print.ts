/**
 * Bluetooth thermal printer integration.
 *
 * Provides discover/connect/print functions for ESC/POS thermal receipt printers
 * over Bluetooth. Falls back gracefully if the native module is not installed
 * (e.g., on simulators or when the library hasn't been linked).
 *
 * Usage:
 * 1. discoverPrinters() — list paired/paired-nearby printers
 * 2. connectPrinter(macAddress) — connect to a printer
 * 3. printTicket(ticketData) — print a boarding pass receipt
 */
import { Alert, Linking, Platform } from "react-native";

interface TicketData {
  passengerName: string;
  bookingReference: string;
  route: string;
  departureDate: string;
  seatLabel: string | null;
  amountXOF: number;
  terminalName: string;
  companyName: string;
}

interface PrinterDevice {
  name: string;
  address: string;
}

let BluetoothPrinter: {
  getDeviceList: () => Promise<PrinterDevice[]>;
  connectPrinter: (address: string) => Promise<unknown>;
  printBill: (lines: Array<Record<string, unknown>>) => Promise<void>;
} | null = null;

if (Platform.OS !== "web") {
  try {
    BluetoothPrinter = require("react-native-thermal-receipt-printer-enhanced");
  } catch {
    BluetoothPrinter = null;
  }
}

export async function discoverPrinters(): Promise<PrinterDevice[]> {
  if (!BluetoothPrinter) return [];
  if (Platform.OS === "android") {
    const enabled = await BluetoothPrinter.getDeviceList().catch(() => []);
    return enabled;
  }
  if (Platform.OS === "ios") {
    const paired = await BluetoothPrinter.getDeviceList().catch(() => []);
    return paired;
  }
  return [];
}

export async function connectPrinter(address: string): Promise<boolean> {
  if (!BluetoothPrinter) return false;
  try {
    await BluetoothPrinter.connectPrinter(address);
    return true;
  } catch {
    return false;
  }
}

export async function printTicket(data: TicketData): Promise<void> {
  if (!BluetoothPrinter) {
    Alert.alert(
      "Imprimante non disponible",
      "L'imprimante Bluetooth n'est pas configurée.",
    );
    return;
  }

  const lines = [
    {
      type: "TEXT",
      value: data.companyName,
      style: { bold: true, align: "CENTER", size: 2 },
    },
    { type: "TEXT", value: "BILLET DE TRANSPORT", style: { align: "CENTER" } },
    { type: "SEPARATOR" },
    { type: "TEXT", value: `Passager : ${data.passengerName}` },
    { type: "TEXT", value: `Ref : ${data.bookingReference}` },
    { type: "TEXT", value: `Trajet : ${data.route}` },
    { type: "TEXT", value: `Départ : ${data.departureDate}` },
    ...(data.seatLabel
      ? [{ type: "TEXT", value: `Siège : ${data.seatLabel}` }]
      : []),
    {
      type: "TEXT",
      value: `Montant : ${data.amountXOF.toLocaleString("fr-CI")} XOF`,
    },
    { type: "SEPARATOR" },
    { type: "TEXT", value: `Terminal : ${data.terminalName}` },
    {
      type: "TEXT",
      value: "Présentez ce ticket à l'embarquement",
      style: { align: "CENTER", small: true },
    },
    {
      type: "TEXT",
      value: "Moja Ride — mojaride.com",
      style: { align: "CENTER", small: true },
    },
    { type: "FEED", value: 3 },
  ];

  await BluetoothPrinter.printBill(lines as never[]);
}

export async function openBluetoothSettings(): Promise<void> {
  if (Platform.OS === "android") {
    Linking.sendIntent("android.bluetooth.settings.BLUETOOTH_SETTINGS");
  } else {
    Linking.openSettings();
  }
}

export type { TicketData };
