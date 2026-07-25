// Locale type — single source of truth derived from routing config
import type { routing } from "./routing";

export type Locale = (typeof routing.locales)[number];
