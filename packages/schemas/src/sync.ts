export interface OfflineSaleDraft {
  localId: string;
  agentId: string;
  tripId: string;
  seatIds: string[];
  totalAmount: number;
  currency: "XOF";
  createdAt: string;
}

export interface SyncBatch<TItem> {
  deviceId: string;
  generatedAt: string;
  items: TItem[];
}
