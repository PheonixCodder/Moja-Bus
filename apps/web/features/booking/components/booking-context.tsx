"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type BookingStep = "seats" | "checkout";

interface BookingContextValue {
  step: BookingStep;
  setStep: (step: BookingStep) => void;
  selectedSeatIds: string[];
  toggleSeat: (seatId: string) => void;
  clearSeats: () => void;
  passengerCount: number;
  priceAccepted: boolean;
  setPriceAccepted: (accepted: boolean) => void;
}

const BookingCtx = createContext<BookingContextValue | null>(null);

export function BookingProvider({
  passengerCount,
  children,
}: {
  passengerCount: number;
  children: ReactNode;
}) {
  const [step, setStep] = useState<BookingStep>("seats");
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [priceAccepted, setPriceAccepted] = useState(false);

  function toggleSeat(seatId: string) {
    setSelectedSeatIds((prev) => {
      if (prev.includes(seatId)) return prev.filter((id) => id !== seatId);
      if (prev.length >= passengerCount) return prev;
      return [...prev, seatId];
    });
  }

  return (
    <BookingCtx.Provider
      value={{
        step, setStep,
        selectedSeatIds, toggleSeat, clearSeats: () => setSelectedSeatIds([]),
        passengerCount,
        priceAccepted, setPriceAccepted,
      }}
    >
      {children}
    </BookingCtx.Provider>
  );
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingCtx);
  if (!ctx) throw new Error("useBooking must be used inside BookingProvider");
  return ctx;
}
