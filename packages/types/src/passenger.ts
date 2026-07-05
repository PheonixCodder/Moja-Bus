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
