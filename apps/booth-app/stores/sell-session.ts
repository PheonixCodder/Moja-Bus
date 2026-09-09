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

export const useSellSession = create<SellSessionState>((set) => ({
  ...initialState,
  setTrip: (tripId, isIntercity) => set({ tripId, isIntercity }),
  setSeat: (seatId, tripSeatId) => set({ seatId, tripSeatId }),
  setPassengerCount: (count) => set({ passengerCount: count }),
  setPassenger: (data) => set(data),
  setFare: (amountXOF) => set({ fareAmountXOF: amountXOF }),
  setTerminals: (terminalId, destinationTerminalId) =>
    set({ terminalId, destinationTerminalId }),
  reset: () => set(initialState),
}));
