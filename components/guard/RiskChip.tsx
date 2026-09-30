import clsx from "@/lib/clsx";
import type { RiskLevel } from "@/lib/guard/types";
import { RISK_LEVEL_LABEL } from "@/lib/guard/decodeTemplates";

const STYLES: Record<RiskLevel, string> = {
  low: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  medium: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  high: "bg-rose-500/10 text-rose-300 border-rose-500/30",
};

export function RiskChip({ label, level }: { label: string; level: RiskLevel }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        STYLES[level]
      )}
    >
      <span className="opacity-70">{label}</span>
      <span>{RISK_LEVEL_LABEL[level]}</span>
    </span>
  );
}
