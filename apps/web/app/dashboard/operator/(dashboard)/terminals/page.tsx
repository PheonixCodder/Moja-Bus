import { OperatorTerminalsView } from "@/features/operator/views/operator-terminals-view";

export const metadata = {
  title: "Terminal Management - Moja Ride Operator Dashboard",
  description:
    "Manage depots and bookable passenger terminals for intercity routes.",
};

export default function OperatorTerminalsPage() {
  return <OperatorTerminalsView />;
}
