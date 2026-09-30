import type { Metadata } from "next";
import { CharterShareView } from "@/components/guard/CharterShareView";

export const metadata: Metadata = {
  title: "Shared Neuro Charter",
};

export default async function SharedCharterPage({
  params,
}: {
  params: Promise<{ payload: string }>;
}) {
  const { payload } = await params;
  return (
    <div className="bg-guard-gradient min-h-full">
      <CharterShareView payload={payload} />
    </div>
  );
}
