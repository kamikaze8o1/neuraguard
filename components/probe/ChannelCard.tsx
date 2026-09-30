"use client";

import { useState } from "react";
import clsx from "@/lib/clsx";
import type { ChannelDef } from "@/lib/probe/consent";
import { OVERRIDE_CONFIRM_PHRASE } from "@/lib/probe/consent";

export function ChannelCard({
  def,
  enabled,
  blocked,
  overridden,
  onToggle,
  onOverride,
}: {
  def: ChannelDef;
  enabled: boolean;
  blocked: boolean;
  overridden: boolean;
  onToggle: (enabled: boolean) => void;
  onOverride: () => void;
}) {
  const [overrideInput, setOverrideInput] = useState("");
  const showBlockedGate = blocked && !overridden;

  return (
    <div
      className={clsx(
        "card-probe rounded-2xl p-5 transition-colors",
        showBlockedGate && "border-probe-accent2/50"
      )}
    >
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={enabled}
          disabled={showBlockedGate}
          onChange={(e) => onToggle(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 rounded border-probe-border bg-black/30 accent-probe-accent disabled:opacity-40"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-probe-ink">{def.title}</span>
          <span className="mt-1 block text-sm text-probe-muted">{def.description}</span>
          <span className="mt-1.5 block text-xs text-probe-muted/70">{def.supportedNote}</span>
        </span>
      </label>

      {showBlockedGate && (
        <div className="mt-3.5 rounded-lg border border-probe-accent2/40 bg-probe-accent2/10 p-3.5">
          <p className="text-sm font-medium text-probe-accent2">🔒 Blocked by your Neuro Charter</p>
          <p className="mt-1 text-xs text-probe-muted">
            Your charter denies read/infer access for the related pillar. Type{" "}
            <code className="rounded bg-black/30 px-1 py-0.5 text-probe-accent2">{OVERRIDE_CONFIRM_PHRASE}</code>{" "}
            to temporarily override for this educational session.
          </p>
          <div className="mt-2.5 flex gap-2">
            <input
              value={overrideInput}
              onChange={(e) => setOverrideInput(e.target.value)}
              placeholder={OVERRIDE_CONFIRM_PHRASE}
              className="min-w-0 flex-1 rounded-md border border-probe-border bg-black/30 px-2.5 py-1.5 text-sm text-probe-ink placeholder:text-probe-muted/40 focus:border-probe-accent2 focus:outline-none"
            />
            <button
              type="button"
              disabled={overrideInput !== OVERRIDE_CONFIRM_PHRASE}
              onClick={() => {
                onOverride();
                setOverrideInput("");
              }}
              className="shrink-0 rounded-md bg-probe-accent2 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Override
            </button>
          </div>
        </div>
      )}

      {blocked && overridden && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-probe-accent2/15 px-2.5 py-1 text-xs font-medium text-probe-accent2">
          ⚠ Charter override active for this channel
        </p>
      )}
    </div>
  );
}
