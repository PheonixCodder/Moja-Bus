/**
 * Corridor label for operator review cards.
 * Prefer live schedule→route terminal cities; fall back to routeSnapshotJson.
 */

type TerminalLike = {
  name?: string | null;
  city?: string | null;
  cityRelation?: { name?: string | null } | null;
} | null;

type ScheduleRouteLike = {
  name?: string | null;
  originTerminal?: TerminalLike;
  destTerminal?: TerminalLike;
} | null;

function terminalCity(terminal: TerminalLike): string {
  if (!terminal) return "";
  return (
    terminal.cityRelation?.name?.trim() ||
    terminal.city?.trim() ||
    terminal.name?.trim() ||
    ""
  );
}

function snapshotTerminalCity(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const t = value as Record<string, unknown>;
  const cityRelation = t["cityRelation"];
  if (cityRelation && typeof cityRelation === "object") {
    const name = (cityRelation as { name?: unknown }).name;
    if (typeof name === "string" && name.trim()) return name.trim();
  }
  const city = t["city"];
  if (typeof city === "string" && city.trim()) return city.trim();
  const name = t["name"];
  if (typeof name === "string" && name.trim()) return name.trim();
  return "";
}

export function reviewCorridorLabel(input: {
  scheduleRoute?: ScheduleRouteLike;
  routeSnapshotJson?: unknown;
  empty?: string;
}): string {
  const origin = terminalCity(input.scheduleRoute?.originTerminal ?? null);
  const dest = terminalCity(input.scheduleRoute?.destTerminal ?? null);
  if (origin && dest) return `${origin} → ${dest}`;

  const snap = input.routeSnapshotJson;
  if (snap && typeof snap === "object") {
    const s = snap as Record<string, unknown>;
    const snapOrigin = snapshotTerminalCity(s["originTerminal"]);
    const snapDest = snapshotTerminalCity(s["destTerminal"]);
    if (snapOrigin && snapDest) return `${snapOrigin} → ${snapDest}`;
    const routeName = s["name"];
    if (typeof routeName === "string" && routeName.trim()) {
      return routeName.trim();
    }
  }

  if (input.scheduleRoute?.name?.trim()) return input.scheduleRoute.name.trim();

  return input.empty ?? "—";
}
