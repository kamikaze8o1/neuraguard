import type { DecodeTemplate } from "@/lib/guard/types";
import { RiskChip } from "./RiskChip";

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-guard-muted">{title}</h4>
      <ul className="mt-2 space-y-1.5 text-sm text-guard-ink/90">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-0.5 text-guard-accent">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DecodeView({ decode }: { decode: DecodeTemplate }) {
  return (
    <div className="card-guard animate-fade-up rounded-2xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-guard-ink">{decode.title}</h3>
          <p className="mt-1 text-sm text-guard-muted">{decode.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <RiskChip label="Privacy" level={decode.risk.privacy} />
          <RiskChip label="Agency" level={decode.risk.agency} />
          <RiskChip label="Integrity" level={decode.risk.integrity} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Section title="What's collected" items={decode.collects} />
        <Section title="What's inferred" items={decode.infers} />
        <Section title="Secondary use" items={decode.secondaryUse} />
        <Section title="Your leverage" items={decode.userLeverage} />
      </div>

      <div className="mt-6 border-t border-guard-border pt-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-guard-muted">Retention</h4>
        <p className="mt-1.5 text-sm text-guard-ink/90">{decode.retention}</p>
      </div>
    </div>
  );
}
