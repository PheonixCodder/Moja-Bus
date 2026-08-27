/**
 * fix-phase1-batch2.js
 * Backfills the final 25 missing keys in admin and operator.
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

// 1. Admin EN & FR
const adminEnPath = path.join(FEATURES_DIR, "admin/messages/en.json");
const adminFrPath = path.join(FEATURES_DIR, "admin/messages/fr.json");

updateJsonFile(adminEnPath, (en) => {
  const ad = en.adminDashboard;
  if (!ad) return;

  // activityFeed statuses
  if (ad.overview && ad.overview.activityFeed) {
    ad.overview.activityFeed.PENDING_VERIFICATION = "Pending Verification";
    ad.overview.activityFeed.ACTIVE = "Active";
    ad.overview.activityFeed.REJECTED = "Rejected";
  }

  // operatorsActionCell / columns
  ad.operatorsActionCell = ad.operatorsActionCell || {};
  ad.operatorsActionCell.selectAllOperators = "Select all operators";
  ad.operatorsActionCell.selectRow = "Select row";
  ad.operatorsActionCell.operator = "Operator";
  ad.operatorsActionCell.company = "Company";
  ad.operatorsActionCell.unassigned = "Unassigned";
  ad.operatorsActionCell.more = "More actions";
  ad.operatorsActionCell.phoneNumber = "Phone Number";
  ad.operatorsActionCell.status = "Status";
  ad.operatorsActionCell.joined = "Joined";

  // verificationsRejectDialog
  ad.verificationsRejectDialog = ad.verificationsRejectDialog || {};
  ad.verificationsRejectDialog.verificationRejected =
    "Verification request rejected.";
  ad.verificationsRejectDialog.failedToRejectCompany =
    "Failed to reject company verification.";
  ad.verificationsRejectDialog.invalidRejectionReason =
    "Please provide a valid rejection reason.";
  ad.verificationsRejectDialog.rejectVerificationRequest =
    "Reject Verification Request";
  ad.verificationsRejectDialog.dialogDescription =
    "Explain why this operator's verification is being rejected. This note will be visible to the operator.";
  ad.verificationsRejectDialog.rejectionReasonPlaceholder =
    "Enter the reason for rejection (e.g. invalid document, missing tax ID)...";
  ad.verificationsRejectDialog.cancel = "Cancel";
  ad.verificationsRejectDialog.submitting = "Rejecting...";
  ad.verificationsRejectDialog.submitRejection = "Confirm Rejection";

  // adminBlogView
  ad.adminBlogView = ad.adminBlogView || {};
  ad.adminBlogView.status = "Status";

  // adminCategoriesView
  ad.adminCategoriesView = ad.adminCategoriesView || {};
  ad.adminCategoriesView.edit = "Edit category";
  ad.adminCategoriesView.delete = "Delete category";
});

updateJsonFile(adminFrPath, (fr) => {
  const ad = fr.adminDashboard;
  if (!ad) return;

  // activityFeed statuses
  if (ad.overview && ad.overview.activityFeed) {
    ad.overview.activityFeed.PENDING_VERIFICATION =
      "En attente de vérification";
    ad.overview.activityFeed.ACTIVE = "Actif";
    ad.overview.activityFeed.REJECTED = "Rejeté";
  }

  // operatorsActionCell / columns
  ad.operatorsActionCell = ad.operatorsActionCell || {};
  ad.operatorsActionCell.selectAllOperators =
    "Sélectionner tous les opérateurs";
  ad.operatorsActionCell.selectRow = "Sélectionner la ligne";
  ad.operatorsActionCell.operator = "Opérateur";
  ad.operatorsActionCell.company = "Entreprise";
  ad.operatorsActionCell.unassigned = "Non assigné";
  ad.operatorsActionCell.more = "Plus d'actions";
  ad.operatorsActionCell.phoneNumber = "Numéro de téléphone";
  ad.operatorsActionCell.status = "Statut";
  ad.operatorsActionCell.joined = "Inscrit le";

  // verificationsRejectDialog
  ad.verificationsRejectDialog = ad.verificationsRejectDialog || {};
  ad.verificationsRejectDialog.verificationRejected =
    "Demande de vérification rejetée.";
  ad.verificationsRejectDialog.failedToRejectCompany =
    "Échec du rejet de la vérification.";
  ad.verificationsRejectDialog.invalidRejectionReason =
    "Veuillez fournir un motif de rejet valide.";
  ad.verificationsRejectDialog.rejectVerificationRequest =
    "Rejeter la demande de vérification";
  ad.verificationsRejectDialog.dialogDescription =
    "Expliquez pourquoi la vérification de cet opérateur est rejetée. Cette note sera visible par l'opérateur.";
  ad.verificationsRejectDialog.rejectionReasonPlaceholder =
    "Saisissez le motif du rejet (ex. document non valide, N° contribuable manquant)...";
  ad.verificationsRejectDialog.cancel = "Annuler";
  ad.verificationsRejectDialog.submitting = "Rejet en cours...";
  ad.verificationsRejectDialog.submitRejection = "Confirmer le rejet";

  // adminBlogView
  ad.adminBlogView = ad.adminBlogView || {};
  ad.adminBlogView.status = "Statut";

  // adminCategoriesView
  ad.adminCategoriesView = ad.adminCategoriesView || {};
  ad.adminCategoriesView.edit = "Modifier la catégorie";
  ad.adminCategoriesView.delete = "Supprimer la catégorie";
});

// 2. Operator FR seatClass
const opFrPath = path.join(FEATURES_DIR, "operator/messages/fr.json");
updateJsonFile(opFrPath, (fr) => {
  if (
    fr.operatorDashboard &&
    fr.operatorDashboard.fleet &&
    fr.operatorDashboard.fleet.addBusDrawer
  ) {
    fr.operatorDashboard.fleet.addBusDrawer.seatClass = {
      ECONOMY: "Économique",
      STANDARD: "Standard",
      VIP: "VIP",
    };
  }
});

console.log("Phase 1 Batch 2 backfilled!");
