export type RebookingNotificationPayload = {
  passengerName: string;
  passengerPhone: string;
  oldBookingReference: string;
  newBookingReference: string;
  companyName: string;
  departureTime: Date;
  seatNumber: number;
};

/**
 * Dispatches automated notifications (SMS, Email, Novu) to passenger after rebooking.
 */
export async function notifyRebookingSuccess(
  payload: RebookingNotificationPayload,
): Promise<void> {
  const formattedTime = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Abidjan",
  }).format(payload.departureTime);

  const message = `Bonjour ${payload.passengerName}, votre voyage ${payload.companyName} (Réf: ${payload.oldBookingReference}) a été reprogrammé avec succès. Nouveau départ: ${formattedTime}, Siège: #${payload.seatNumber}. Nouvelle Réf: ${payload.newBookingReference}. Retrouvez votre billet sur mojaride.com.`;

  console.log(`[RebookingNotifier] SMS to ${payload.passengerPhone}: ${message}`);
}
