import type { Metadata } from "next";
import { FusionDashboard } from "@/components/probe/FusionDashboard";

export const metadata: Metadata = {
  title: "Live Fusion Dashboard",
};

export default function ProbeLivePage() {
  return <FusionDashboard />;
}
