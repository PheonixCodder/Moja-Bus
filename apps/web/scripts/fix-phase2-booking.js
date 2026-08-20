/**
 * fix-phase2-booking.js
 * Adds all booking translation keys and updates booking components.
 */

const fs = require("fs");
const path = require("path");

const WEB_ROOT = path.resolve(__dirname, "..");
const FEATURES_DIR = path.join(WEB_ROOT, "features");

// 1. Update booking/messages/en.json and fr.json
const enPath = path.join(FEATURES_DIR, "booking/messages/en.json");
const frPath = path.join(FEATURES_DIR, "booking/messages/fr.json");

const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
const fr = JSON.parse(fs.readFileSync(frPath, "utf8"));

en.booking.checkout = Object.assign(en.booking.checkout || {}, {
  seatsLabel: "Seats:",
  fare: "Fare",
  serviceFee: "Service fee",
  total: "Total",
  passengersPerSeat: "Passengers per seat",
  applyToAll: "Apply to all:",
  choosePassenger: "Choose passenger",
  signInToUseSaved: "Sign in",
  signInToUseSavedSuffix: "to use saved passengers, or enter details manually below.",
  seat: "Seat",
  passenger: "Passenger",
  enterManually: "Enter manually",
  fullName: "Full name",
  fullNamePlaceholder: "Full name as on ID",
  phoneNumber: "Phone number",
  manageSavedPassengersIn: "Manage saved passengers in",
  yourDashboard: "your dashboard",
  promoCoveredTitle: "100% Covered by Promo Credits",
  promoCoveredDesc: "Your promotional balance fully covers the ticket fare. No cash, card, or wallet debit is required.",
  paymentOptions: "Payment Options",
  paymentOptionsDesc: "Choose a checkout method below to complete seat registration.",
  cardMobileMoney: "Card / Mobile Money",
  payViaPaystack: "Pay via Paystack checkout",
  mojaWalletBalance: "Moja Wallet Balance",
  walletBenefitTitle: "Moja Wallet Checkout Benefit",
  walletBenefitDesc: "Service convenience fees are fully waived (0 XOF) when paying with your internal wallet balance.",
  walletTip: "Tip: Switch to Wallet Balance to waive the convenience fee!",
  insufficientBalance: "Your wallet balance is insufficient for this booking (need {needed}, have {have}).",
  topUpWallet: "Top-Up Wallet →",
  backToSeats: "Back to seats",
  processing: "Processing...",
});

fr.booking.checkout = Object.assign(fr.booking.checkout || {}, {
  seatsLabel: "Sièges :",
  fare: "Tarif",
  serviceFee: "Frais de service",
  total: "Total",
  passengersPerSeat: "Passagers par siège",
  applyToAll: "Appliquer à tous :",
  choosePassenger: "Choisir un passager",
  signInToUseSaved: "Connectez-vous",
  signInToUseSavedSuffix: "pour utiliser vos passagers enregistrés, ou saisissez les informations ci-dessous.",
  seat: "Siège",
  passenger: "Passager",
  enterManually: "Saisir manuellement",
  fullName: "Nom complet",
  fullNamePlaceholder: "Nom complet comme sur la pièce d'identité",
  phoneNumber: "Numéro de téléphone",
  manageSavedPassengersIn: "Gérez vos passagers enregistrés dans",
  yourDashboard: "votre tableau de bord",
  promoCoveredTitle: "100% Couvert par les crédits promo",
  promoCoveredDesc: "Votre solde promotionnel couvre l'intégralité du billet. Aucun débit carte ou portefeuille n'est requis.",
  paymentOptions: "Options de paiement",
  paymentOptionsDesc: "Choisissez un mode de paiement ci-dessous pour finaliser votre réservation.",
  cardMobileMoney: "Carte / Mobile Money",
  payViaPaystack: "Payer via le paiement Paystack",
  mojaWalletBalance: "Solde du portefeuille Moja",
  walletBenefitTitle: "Avantage portefeuille Moja",
  walletBenefitDesc: "Les frais de service sont totalement offerts (0 XOF) lors du paiement avec votre portefeuille.",
  walletTip: "Astuce : Payez avec votre portefeuille pour économiser les frais de service !",
  insufficientBalance: "Le solde de votre portefeuille est insuffisant (besoin de {needed}, disponible : {have}).",
  topUpWallet: "Recharger le portefeuille →",
  backToSeats: "Retour aux sièges",
  processing: "Traitement en cours...",
});

en.booking.routeMap = {
  origin: "Origin",
  destination: "Destination",
  standardRoute: "Standard Route",
};

fr.booking.routeMap = {
  origin: "Départ",
  destination: "Destination",
  standardRoute: "Itinéraire standard",
};

en.booking.confirmed = "Confirmed";
fr.booking.confirmed = "Confirmé";
en.booking.seats = "Seats";
fr.booking.seats = "Sièges";
en.booking.amenitiesIncludes = "Includes:";
fr.booking.amenitiesIncludes = "Inclus :";
en.ticket.digitalBoardingPass = "Digital Boarding Pass";
fr.ticket.digitalBoardingPass = "Carte d'embarquement numérique";

fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + "\n", "utf8");
fs.writeFileSync(frPath, JSON.stringify(fr, null, 2) + "\n", "utf8");
console.log("Updated booking locale files!");
