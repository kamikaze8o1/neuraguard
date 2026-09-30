"use client";

import clsx from "@/lib/clsx";
import type { CharterPillarState, PillarDef, StanceLevel } from "@/lib/guard/types";

const STANCE_OPTIONS: { id: StanceLevel; label: string }[] = [
  { id: "protect", label: "Protect" },
  { id: "balanced", label: "Balanced" },
  { id: "permit", label: "Permit" },
];

export function PillarCard({
  def,
  state,
  onStanceChange,
  onRuleChange,
  onNoteChange,
}: {
  def: PillarDef;
  state: CharterPillarState;
  onStanceChange: (stance: StanceLevel) => void;
  onRuleChange: (ruleId: string, enabled: boolean) => void;
  onNoteChange: (note: string) => void;
}) {
  return (
    <div className="card-guard animate-fade-up rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-guard-ink">{def.title}</h3>
          <p className="mt-1 text-sm text-guard-muted">{def.tagline}</p>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-guard-muted/90">{def.description}</p>

      <div className="mt-4">
        <div className="inline-flex rounded-full border border-guard-border bg-black/20 p-1">
          {STANCE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onStanceChange(opt.id)}
              className={clsx(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                state.stance === opt.id
                  ? "bg-guard-accent text-guard-bg"
                  : "text-guard-muted hover:text-guard-ink"
              )}
              aria-pressed={state.stance === opt.id}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-guard-muted/80">{def.stanceCopy[state.stance]}</p>
      </div>

      <div className="mt-5 space-y-2.5 border-t border-guard-border pt-4">
        {def.rules.map((rule) => {
          const enabled = state.rules[rule.id] ?? false;
          return (
            <label
              key={rule.id}
              className="flex cursor-pointer items-start gap-3 rounded-lg p-2 transition-colors hover:bg-guard-surface2/60"
            >
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => onRuleChange(rule.id, e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-guard-border bg-black/30 accent-guard-accent"
              />
              <span>
                <span className="block text-sm font-medium text-guard-ink">{rule.label}</span>
                <span className="block text-xs text-guard-muted">{rule.description}</span>
              </span>
            </label>
          );
        })}
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-guard-muted">
          Personal note (optional)
        </label>
        <textarea
          value={state.note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="e.g. exceptions for my care team, specific apps you trust…"
          rows={2}
          className="w-full resize-none rounded-lg border border-guard-border bg-black/20 p-2.5 text-sm text-guard-ink placeholder:text-guard-muted/50 focus:border-guard-accent focus:outline-none"
        />
      </div>
    </div>
  );
}
