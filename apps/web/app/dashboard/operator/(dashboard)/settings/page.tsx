import { OperatorSettingsView } from "@/features/operator/views/operator-settings-view";

export const metadata = {
  title: "Company Settings - Moja Ride Operator Dashboard",
  description:
    "Manage company profile details, banking, compliance documents, and verification.",
};

export default function OperatorSettingsPage() {
  return <OperatorSettingsView />;
}
