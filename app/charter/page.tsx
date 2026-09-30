import type { Metadata } from "next";
import { CharterBuilder } from "@/components/guard/CharterBuilder";

export const metadata: Metadata = {
  title: "Neuro Charter",
  description: "Set your stance across 6 neurorights pillars. Stored locally, downloadable as JSON.",
};

export default function CharterPage() {
  return (
    <div className="bg-guard-gradient min-h-full">
      <CharterBuilder />
    </div>
  );
}
