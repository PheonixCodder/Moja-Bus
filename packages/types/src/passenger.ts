export interface SavedPassengerDTO {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  label: string | null;
  dateOfBirth: Date | null;
  idType: string | null;
  idNumber: string | null;
  isSelf: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SavedPassengersListResult {
  items: SavedPassengerDTO[];
  total: number;
}

export interface EnsurePassengerProfileResult {
  profileId: string;
  selfPassenger: SavedPassengerDTO | null;
}

export type TravelInsightsBucket = "MONTHLY" | "DAILY";
export interface TravelInsightsPoint {
  key: string; // "YYYY-MM" (MONTHLY) or "YYYY-MM-DD" (DAILY), Abidjan calendar
  trips: number;
  spentXOF: number;
}
export interface TravelInsightsResult {
  bucket: TravelInsightsBucket;
  items: TravelInsightsPoint[];
}
