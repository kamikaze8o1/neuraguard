import { IncidentPanel } from "@/components/probe/IncidentPanel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Incident Monitor · Anomalous Signal & Frey Detector | NeuraProbe",
  description:
    "Real-time forensic monitoring for ultrasonic carriers, periodic RF rectification pulse trains, and vestibular postural tremor.",
};

export default function IncidentPage() {
  return (
    <div className="side-probe bg-probe-gradient min-h-full">
      <IncidentPanel />
    </div>
  );
}
