import type { Metadata } from "next";
import { AepRunner } from "@/components/probe/AepRunner";

export const metadata: Metadata = {
  title: "AEP Session",
};

export default function ProbeAepPage() {
  return <AepRunner />;
}
