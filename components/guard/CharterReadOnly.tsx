import { PILLAR_DEFS } from "@/lib/guard/charter";
import type { Charter } from "@/lib/guard/types";

const STANCE_LABEL = { protect: "Protect", balanced: "Balanced", permit: "Permit" } as const;

export function CharterReadOnly({ charter }: { charter: Charter }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-guard-accent">Shared Neuro Charter</p>
      <h1 className="mt-1 text-3xl font-semibold text-guard-ink sm:text-4xl">{charter.ownerLabel}</h1>
      <p className="mt-2 text-sm text-guard-muted">
        Read-only view, decoded entirely in your browser from the link — updated{" "}
        {new Date(charter.updatedAt).toLocaleString()}.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-5">
        {PILLAR_DEFS.map((def) => {
          const state = charter.pillars[def.id];
          if (!state) return null;
          const activeRules = def.rules.filter((r) => state.rules[r.id]);
          return (
            <div key={def.id} className="card-guard rounded-2xl p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-guard-ink">{def.title}</h3>
                <span className="rounded-full bg-guard-accent/15 px-3 py-1 text-xs font-semibold text-guard-accent">
                  {STANCE_LABEL[state.stance]}
                </span>
              </div>
              <p className="mt-1 text-sm text-guard-muted">{def.stanceCopy[state.stance]}</p>
              {activeRules.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm text-guard-ink/90">
                  {activeRules.map((r) => (
                    <li key={r.id} className="flex gap-2">
                      <span className="text-guard-accent">✓</span>
                      {r.label}
                    </li>
                  ))}
                </ul>
              )}
              {state.note && (
                <p className="mt-3 rounded-lg bg-black/20 p-2.5 text-xs text-guard-muted">“{state.note}”</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
