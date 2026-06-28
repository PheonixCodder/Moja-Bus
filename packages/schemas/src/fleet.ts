export type VehicleType = "COACH" | "MINIBUS" | "VAN" | "CAR";

export type CrewRole = "DRIVER" | "CO_DRIVER" | "ATTENDANT";

export interface VehicleSummary {
  vehicleId: string;
  plateNumber: string;
  type: VehicleType;
  capacity: number;
}

export interface CrewMemberSummary {
  userId: string;
  role: CrewRole;
  displayName: string;
}
