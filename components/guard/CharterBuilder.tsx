"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "@/lib/clsx";
import {
  PILLAR_DEFS,
  defaultCharter,
  loadCharter,
  saveCharter,
  setOwnerLabel,
  setPillarNote,
  setPillarRule,
  setPillarStance,
  toRuleset,
} from "@/lib/guard/charter";
import { buildShareUrl } from "@/lib/guard/share";
import type { Charter, StanceLevel } from "@/lib/guard/types";
import { PillarCard } from "./PillarCard";

type ViewMode = "build" | "ruleset";

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function CharterBuilder() {
  const [charter, setCharter] = useState<Charter | null>(null);
  const [view, setView] = useState<ViewMode>("build");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCharter(loadCharter());
  }, []);

  useEffect(() => {
    if (charter) saveCharter(charter);
  }, [charter]);

  const ruleset = useMemo(() => (charter ? toRuleset(charter) : null), [charter]);

  if (!charter) {
    return <div className="px-6 py-16 text-center text-guard-muted">Loading your charter…</div>;
  }

  const grantedCount = PILLAR_DEFS.reduce((sum, def) => {
    const state = charter.pillars[def.id];
    return sum + def.rules.filter((r) => state.rules[r.id]).length;
  }, 0);
  const totalRules = PILLAR_DEFS.reduce((sum, def) => sum + def.rules.length, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-guard-accent">Neuro Charter</p>
          <input
            value={charter.ownerLabel}
            onChange={(e) => setCharter(setOwnerLabel(charter, e.target.value))}
            className="mt-1 w-full max-w-sm bg-transparent text-2xl font-semibold text-guard-ink focus:outline-none sm:text-3xl"
          />
          <p className="mt-2 text-sm text-guard-muted">
            {totalRules - grantedCount === 0
              ? "Every protective rule across all 6 pillars is currently active."
              : `${grantedCount} of ${totalRules} protective rules currently active. Local-only — nothing leaves this device.`}
          </p>
        </div>

        <div className="inline-flex rounded-full border border-guard-border bg-black/20 p-1 text-sm">
          <button
            type="button"
            onClick={() => setView("build")}
            className={clsx(
              "rounded-full px-4 py-1.5 font-medium transition-colors",
              view === "build" ? "bg-guard-accent text-guard-bg" : "text-guard-muted hover:text-guard-ink"
            )}
          >
            Build
          </button>
          <button
            type="button"
            onClick={() => setView("ruleset")}
            className={clsx(
              "rounded-full px-4 py-1.5 font-medium transition-colors",
              view === "ruleset" ? "bg-guard-accent text-guard-bg" : "text-guard-muted hover:text-guard-ink"
            )}
          >
            Ruleset (JSON)
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => downloadJson(`neuro-charter-ruleset-${Date.now()}.json`, ruleset)}
          className="rounded-lg border border-guard-border bg-guard-surface2 px-4 py-2 text-sm font-medium text-guard-ink transition-colors hover:border-guard-accent"
        >
          ⬇ Download JSON ruleset
        </button>
        <button
          type="button"
          onClick={() => {
            const url = buildShareUrl(charter);
            setShareUrl(url);
            setCopied(false);
          }}
          className="rounded-lg border border-guard-border bg-guard-surface2 px-4 py-2 text-sm font-medium text-guard-ink transition-colors hover:border-guard-accent"
        >
          ↗ Share read-only card
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm("Reset your charter to the default (most protective) settings?")) {
              setCharter(defaultCharter());
            }
          }}
          className="rounded-lg border border-guard-border px-4 py-2 text-sm font-medium text-guard-muted transition-colors hover:border-rose-500/50 hover:text-rose-300"
        >
          Reset to default
        </button>
      </div>

      {shareUrl && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-guard-border bg-black/30 p-3 text-sm">
          <input
            readOnly
            value={shareUrl}
            className="min-w-0 flex-1 bg-transparent text-guard-ink focus:outline-none"
            onFocus={(e) => e.currentTarget.select()}
          />
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(shareUrl);
              setCopied(true);
            }}
            className="shrink-0 rounded-md bg-guard-accent px-3 py-1.5 text-xs font-semibold text-guard-bg"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}

      {view === "build" ? (
        <div className="mt-8 grid grid-cols-1 gap-5">
          {PILLAR_DEFS.map((def) => (
            <PillarCard
              key={def.id}
              def={def}
              state={charter.pillars[def.id]}
              onStanceChange={(stance: StanceLevel) => setCharter(setPillarStance(charter, def.id, stance))}
              onRuleChange={(ruleId, enabled) => setCharter(setPillarRule(charter, def.id, ruleId, enabled))}
              onNoteChange={(note) => setCharter(setPillarNote(charter, def.id, note))}
            />
          ))}
        </div>
      ) : (
        <pre className="mt-8 overflow-x-auto rounded-2xl border border-guard-border bg-black/40 p-4 text-xs leading-relaxed text-emerald-200">
          {JSON.stringify(ruleset, null, 2)}
        </pre>
      )}
    </div>
  );
}
