import { PatentExplorer } from "@/components/guard/PatentExplorer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Patent Registry · Havana Syndrome & Frey Effect | NeuraGuard",
  description:
    "Exhaustive technical database and biophysical analysis of patents covering the Frey Effect, Microwave Auditory Effect, acoustic heterodyning, and directed energy related to Havana Syndrome.",
};

export default function PatentsPage() {
  return (
    <div className="side-guard bg-guard-gradient min-h-full">
      <PatentExplorer />
    </div>
  );
}
