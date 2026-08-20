/**
 * fix-phase1-keys.js
 * Automatically backfills all 102 missing keys and 6 FR drift keys
 * into their respective feature and global messages files.
 */

const fs = require("fs");
const path = require("path");

const WEB_ROOT = path.resolve(__dirname, "..");
const FEATURES_DIR = path.join(WEB_ROOT, "features");

function updateJsonFile(filePath, mutator) {
  const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
  mutator(content);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + "\n", "utf8");
  console.log(`Updated ${path.relative(WEB_ROOT, filePath)}`);
}

// ─── 1. Admin Feature Updates ─────────────────────────────────────────────
const adminEnPath = path.join(FEATURES_DIR, "admin/messages/en.json");
const adminFrPath = path.join(FEATURES_DIR, "admin/messages/fr.json");

updateJsonFile(adminEnPath, (en) => {
  const ad = en.adminDashboard;
  if (!ad) return;

  // badge
  ad.badge = ad.badge || "Admin";

  // webhookPayloadDrawer
  ad.webhookPayloadDrawer = ad.webhookPayloadDrawer || {};
  ad.webhookPayloadDrawer.pending = "Pending";
  ad.webhookPayloadDrawer.processed = "Processed";
  ad.webhookPayloadDrawer.failed = "Failed";

  // adminOperationsView
  ad.adminOperationsView = ad.adminOperationsView || {};
  ad.adminOperationsView.status = "Status";

  // adminSettingsView
  ad.adminSettingsView = ad.adminSettingsView || {};
  ad.adminSettingsView.platformSettingsUpdated = "Platform settings updated successfully.";
  ad.adminSettingsView.failedToUpdateSettings = "Failed to update platform settings.";

  // adminTagsView
  ad.adminTagsView = ad.adminTagsView || {};
  ad.adminTagsView.edit = "Edit tag";
  ad.adminTagsView.delete = "Delete tag";

  // adminTravelerProfileView
  ad.adminTravelerProfileView = ad.adminTravelerProfileView || {};
  ad.adminTravelerProfileView.self = "Self";

  // blogEditView
  ad.blogEditView = ad.blogEditView || {};
  ad.blogEditView.publishDateAndTime = "Publish date & time";
  ad.blogEditView.selectPublicationTime = "Select publication time";
  ad.blogEditView.featureFlags = "Feature flags";
  ad.blogEditView.image = "Cover image";
  ad.blogEditView.overrideTitleInSearchResults = "Override title in search results";

  // newBlogPostDialog
  ad.newBlogPostDialog = ad.newBlogPostDialog || {};
  ad.newBlogPostDialog["e.g.5TipsForSafeIntercityTravel"] = "e.g. 5 Tips for Safe Intercity Travel";
});

updateJsonFile(adminFrPath, (fr) => {
  const ad = fr.adminDashboard;
  if (!ad) return;

  // blogAnalytics (missing in FR)
  ad.blogAnalytics = ad.blogAnalytics || {};
  ad.blogAnalytics.overview = "Aperçu";
  ad.blogAnalytics.last7Days = "7 derniers jours";
  ad.blogAnalytics.last30Days = "30 derniers jours";
  ad.blogAnalytics.last90Days = "90 derniers jours";
  ad.blogAnalytics.allTime = "Tout le temps";

  // badge
  ad.badge = ad.badge || "Admin";

  // webhookPayloadDrawer
  ad.webhookPayloadDrawer = ad.webhookPayloadDrawer || {};
  ad.webhookPayloadDrawer.pending = "En attente";
  ad.webhookPayloadDrawer.processed = "Traité";
  ad.webhookPayloadDrawer.failed = "Échoué";

  // adminOperationsView
  ad.adminOperationsView = ad.adminOperationsView || {};
  ad.adminOperationsView.status = "Statut";

  // adminSettingsView
  ad.adminSettingsView = ad.adminSettingsView || {};
  ad.adminSettingsView.platformSettingsUpdated = "Paramètres de la plateforme mis à jour avec succès.";
  ad.adminSettingsView.failedToUpdateSettings = "Échec de la mise à jour des paramètres.";

  // adminTagsView
  ad.adminTagsView = ad.adminTagsView || {};
  ad.adminTagsView.edit = "Modifier le tag";
  ad.adminTagsView.delete = "Supprimer le tag";

  // adminTravelerProfileView
  ad.adminTravelerProfileView = ad.adminTravelerProfileView || {};
  ad.adminTravelerProfileView.self = "Titulaire";

  // blogEditView
  ad.blogEditView = ad.blogEditView || {};
  ad.blogEditView.publishDateAndTime = "Date et heure de publication";
  ad.blogEditView.selectPublicationTime = "Sélectionner l'heure de publication";
  ad.blogEditView.featureFlags = "Options de fonctionnalité";
  ad.blogEditView.image = "Image de couverture";
  ad.blogEditView.overrideTitleInSearchResults = "Remplacer le titre dans les résultats de recherche";

  // newBlogPostDialog
  ad.newBlogPostDialog = ad.newBlogPostDialog || {};
  ad.newBlogPostDialog["e.g.5TipsForSafeIntercityTravel"] = "ex. 5 conseils pour voyager en toute sécurité";
});

// ─── 2. Invitation Feature Updates ─────────────────────────────────────────
const inviteEnPath = path.join(FEATURES_DIR, "invitation/messages/en.json");
const inviteFrPath = path.join(FEATURES_DIR, "invitation/messages/fr.json");

updateJsonFile(inviteEnPath, (en) => {
  en.adminInvite = en.adminInvite || {};
  en.adminInvite.email = "Email Address";
  en.adminInvite.fullName = "Full Name";
  en.adminInvite.namePlaceholder = "e.g. John Doe";
  en.adminInvite.sendCode = "Send Verification Code";
  en.adminInvite.back = "Back";
});

updateJsonFile(inviteFrPath, (fr) => {
  fr.adminInvite = fr.adminInvite || {};
  fr.adminInvite.email = "Adresse e-mail";
  fr.adminInvite.fullName = "Nom complet";
  fr.adminInvite.namePlaceholder = "ex. Jean Dupont";
  fr.adminInvite.sendCode = "Envoyer le code de vérification";
  fr.adminInvite.back = "Retour";
});

// ─── 3. Booking Feature Updates ────────────────────────────────────────────
const bookingEnPath = path.join(FEATURES_DIR, "booking/messages/en.json");
const bookingFrPath = path.join(FEATURES_DIR, "booking/messages/fr.json");

updateJsonFile(bookingEnPath, (en) => {
  en.booking = en.booking || {};
  en.booking.selectSavedPassenger = "Select a saved passenger or enter details below.";
  en.booking.enterPassengerName = "Please enter passenger name for seat {seat}";
  en.booking.enterPassengerPhone = "Please enter passenger phone number for seat {seat}";
  en.booking.seatConflictToast = "Some selected seats are no longer available. Please choose other seats.";
  en.booking.bookingFailed = "Failed to create booking. Please try again.";
  en.booking.bookingSuccess = "Booking confirmed successfully!";
  en.booking.paymentCancelled = "Payment was cancelled.";
  en.booking.paymentFailed = "Payment failed. Please verify and try again.";
  en.printTicket = en.printTicket || "Print Ticket";
});

updateJsonFile(bookingFrPath, (fr) => {
  fr.booking = fr.booking || {};
  fr.booking.selectSavedPassenger = "Sélectionnez un passager enregistré ou renseignez les détails ci-dessous.";
  fr.booking.enterPassengerName = "Veuillez saisir le nom du passager pour le siège {seat}";
  fr.booking.enterPassengerPhone = "Veuillez saisir le numéro de téléphone pour le siège {seat}";
  fr.booking.seatConflictToast = "Certains sièges sélectionnés ne sont plus disponibles. Veuillez en choisir d'autres.";
  fr.booking.bookingFailed = "Échec de la réservation. Veuillez réessayer.";
  fr.booking.bookingSuccess = "Réservation confirmée avec succès !";
  fr.booking.paymentCancelled = "Le paiement a été annulé.";
  fr.booking.paymentFailed = "Échec du paiement. Veuillez vérifier et réessayer.";
  fr.printTicket = fr.printTicket || "Imprimer le billet";
});

// ─── 4. Operator Feature Updates ───────────────────────────────────────────
const opEnPath = path.join(FEATURES_DIR, "operator/messages/en.json");
const opFrPath = path.join(FEATURES_DIR, "operator/messages/fr.json");

updateJsonFile(opEnPath, (en) => {
  const od = en.operatorDashboard || {};
  en.operatorDashboard = od;

  // layoutBuilder
  if (od.fleet && od.fleet.layoutBuilder) {
    od.fleet.layoutBuilder.configure = "Configure";
    od.fleet.layoutBuilder.design = "Design";
    od.fleet.layoutBuilder.preview = "Preview";
    od.fleet.layoutBuilder.entranceDoor = "Entrance door";
  }

  // staff
  if (od.staff && od.staff.roleSheet) {
    od.staff.roleSheet.resetNotice = "Resetting permissions will restore default settings for this role.";
  }

  // error
  od.error = od.error || {
    title: "Something went wrong",
    message: "An unexpected error occurred while loading operator data.",
    retry: "Try Again",
  };

  // addBusModal legacy
  en.operator = en.operator || {};
  en.operator.addBusModal = en.operator.addBusModal || {};
  en.operator.addBusModal.seatClass = {
    STANDARD: "Standard",
    VIP: "VIP",
    ECONOMY: "Economy",
  };
});

updateJsonFile(opFrPath, (fr) => {
  const od = fr.operatorDashboard || {};
  fr.operatorDashboard = od;

  // fleet addBusTypeDialog (missing in FR)
  if (od.fleet) {
    od.fleet.addBusType = "Ajouter un type de bus";
    od.fleet.addBusTypeDialog = {
      title: "Ajouter un type de bus",
      description: "Créer un type de véhicule personnalisé pour votre flotte",
      nameLabel: "Nom *",
      namePlaceholder: "ex. Iveco Daily",
      descLabel: "Description",
      descPlaceholder: "ex. Minibus 15 places (facultatif)",
      submitBtn: "Ajouter le type de bus",
      cancelBtn: "Annuler",
      created: "Type de bus créé",
      error: "Échec de la création du type de bus",
      errors: {
        required: "Le nom est requis",
        tooShort: "Le nom doit comporter au moins 2 caractères",
      },
    };

    if (od.fleet.layoutBuilder) {
      od.fleet.layoutBuilder.configure = "Configurer";
      od.fleet.layoutBuilder.design = "Concevoir";
      od.fleet.layoutBuilder.preview = "Aperçu";
      od.fleet.layoutBuilder.entranceDoor = "Porte d'entrée";
    }
  }

  // schedules filters (missing in FR)
  if (od.schedules) {
    od.schedules.wizard = od.schedules.wizard || {};
    od.schedules.wizard.duplicateTime = "Cet horaire existe déjà.";
    od.schedules.filters = {
      statusAria: "Filtrer par statut",
      statusAll: "Tous",
      statusActive: "Actif",
      statusInactive: "Inactif",
      serviceTypeAria: "Filtrer par type de service",
      serviceTypeAll: "Tous les services",
      serviceTypeIntercity: "Interurbain",
      serviceTypeUrban: "Urbain",
      routeAria: "Filtrer par ligne",
      allRoutes: "Toutes les lignes",
    };
  }

  // staff
  if (od.staff && od.staff.roleSheet) {
    od.staff.roleSheet.resetNotice = "La réinitialisation des permissions restaurera les paramètres par défaut pour ce rôle.";
  }

  // error
  od.error = od.error || {
    title: "Une erreur est survenue",
    message: "Une erreur inattendue est survenue lors du chargement des données de l'opérateur.",
    retry: "Réessayer",
  };

  // addBusModal legacy
  fr.operator = fr.operator || {};
  fr.operator.addBusModal = fr.operator.addBusModal || {};
  fr.operator.addBusModal.seatClass = {
    STANDARD: "Standard",
    VIP: "VIP",
    ECONOMY: "Économique",
  };
});

console.log("Phase 1 keys successfully backfilled!");
