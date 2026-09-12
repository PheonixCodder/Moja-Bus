import { create } from "zustand";

export interface SellSessionState {
  tripId: string | null;
  seatId: string | null;
  tripSeatId: string | null;
  passengerCount: number;
  isIntercity: boolean;
  passengerId: string | null;
  passengerName: string | null;
  passengerEmail: string | null;
  passengerPhone: string | null;
  isNewAccount: boolean;
  terminalId: string | null;
  destinationTerminalId: string | null;
  fareAmountXOF: number | null;

  setTrip: (tripId: string, isIntercity: boolean) => void;
  setSeat: (seatId: string | null, tripSeatId: string | null) => void;
  setPassengerCount: (count: number) => void;
  setPassenger: (data: {
    passengerId: string;
    passengerName: string;
    passengerEmail: string;
    passengerPhone?: string | null;
    isNewAccount: boolean;
  }) => void;
  setFare: (amountXOF: number) => void;
  setTerminals: (terminalId: string, destinationTerminalId: string) => void;
  validateSession: () => {
    valid: boolean;
    errors: string[];
  };
  reset: () => void;
}

const initialState = {
  tripId: null,
  seatId: null,
  tripSeatId: null,
  passengerCount: 1,
  isIntercity: true,
  passengerId: null,
  passengerName: null,
  passengerEmail: null,
  passengerPhone: null,
  isNewAccount: false,
  terminalId: null,
  destinationTerminalId: null,
  fareAmountXOF: null,
};

export const useSellSession = create<SellSessionState>((set, get) => ({
  ...initialState,
  setTrip: (tripId, isIntercity) => set({ tripId, isIntercity }),
  setSeat: (seatId, tripSeatId) => set({ seatId, tripSeatId }),
  setPassengerCount: (count) => set({ passengerCount: count }),
  setPassenger: (data) => set(data),
  setFare: (amountXOF) => set({ fareAmountXOF: amountXOF }),
  setTerminals: (terminalId, destinationTerminalId) =>
    set({ terminalId, destinationTerminalId }),
  validateSession: () => {
    const s = get();
    const errors: string[] = [];
    if (!s.tripId) errors.push("tripId is required");
    if (!s.passengerId) errors.push("passengerId is required");
    if (!s.passengerName) errors.push("passengerName is required");
    if (!s.passengerEmail) errors.push("passengerEmail is required");
    if (!s.terminalId) errors.push("origin terminalId is required");
    if (!s.destinationTerminalId)
      errors.push("destinationTerminalId is required");
    if (s.fareAmountXOF == null || s.fareAmountXOF < 0)
      errors.push("fareAmountXOF must be non-negative");
    if (s.isIntercity && !s.seatId)
      errors.push("seatId is required for intercity trips");
    return { valid: errors.length === 0, errors };
  },
  reset: () => set(initialState),
}));

/** Granular selectors for sell session */
export const selectSellTripId = (s: SellSessionState) => s.tripId;
export const selectSellSeatId = (s: SellSessionState) => s.seatId;
export const selectSellFare = (s: SellSessionState) => s.fareAmountXOF;
export const selectIsIntercity = (s: SellSessionState) => s.isIntercity;
export const selectPassengerName = (s: SellSessionState) => s.passengerName;
