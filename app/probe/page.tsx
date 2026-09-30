"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadCharter, pillarDeniesReadOrInfer, hasStoredCharter } from "@/lib/guard/charter";
import type { Charter } from "@/lib/guard/types";
import {
  CHANNEL_DEFS,
  defaultConsent,
  loadConsent,
  loadOverrides,
  saveConsent,
  saveOverrides,
} from "@/lib/probe/consent";
import type { ChannelId, ConsentMap } from "@/lib/probe/types";
import { ChannelCard } from "@/components/probe/ChannelCard";

export default function ProbeGatePage() {
  const [charter, setCharter] = useState<Charter | null>(null);
  const [charterExists, setCharterExists] = useState(false);
  const [consent, setConsent] = useState<ConsentMap>(defaultConsent());
  const [overrides, setOverrides] = useState<ChannelId[]>([]);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    setCharterExists(hasStoredCharter());
    setCharter(loadCharter());
    setConsent(loadConsent());
    setOverrides(loadOverrides());
  }, []);

  function updateConsent(next: ConsentMap) {
    setConsent(next);
    saveConsent(next);
  }

  function updateOverrides(next: ChannelId[]) {
    setOverrides(next);
    saveOverrides(next);
  }

  const anyEnabled = Object.values(consent).some(Boolean);

  return (
    <div className="side-probe bg-probe-gradient min-h-full">
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-probe-accent">NeuraProbe · Consent Gate</p>
        <h1 className="mt-1 text-3xl font-semibold text-probe-ink sm:text-4xl">
          What can be sensed without your charter
        </h1>

        <div className="mt-5 rounded-2xl border border-probe-accent/40 bg-probe-accent/10 p-4">
          <p className="text-sm font-semibold text-probe-accent">Educational demo — read before continuing</p>
          <p className="mt-2 text-sm text-probe-ink/90">
            NeuraProbe demonstrates real sensor-fusion acquisition techniques using only your browser and
            device hardware. It is <strong>not a diagnostic or medical device</strong>, and it must never be
            used for covert surveillance or employer/insurer monitoring of another person. All data stays on
            this device unless you explicitly export a file yourself.
          </p>
          <label className="mt-3 flex items-start gap-2 text-sm text-probe-ink">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-probe-accent"
            />
            I understand this is an educational demonstration, not a clinical device, and I will only use it
            on myself with informed consent.
          </label>
        </div>

        {charterExists ? (
          <p className="mt-4 text-sm text-probe-muted">
            A NeuraGuard charter was found on this device — channels that conflict with your stance will show
            as blocked below.{" "}
            <Link href="/charter" className="underline hover:text-probe-ink">
              Review your charter →
            </Link>
          </p>
        ) : (
          <p className="mt-4 text-sm text-probe-muted">
            No NeuraGuard charter found on this device yet — every channel below is open by default.{" "}
            <Link href="/charter" className="underline hover:text-probe-ink">
              Build a charter first →
            </Link>
          </p>
        )}

        <fieldset disabled={!acknowledged} className="mt-6 flex flex-col gap-4 disabled:opacity-50">
          {CHANNEL_DEFS.map((def) => {
            const blocked = charter ? pillarDeniesReadOrInfer(charter, def.relatedPillar) : false;
            const overridden = overrides.includes(def.id);
            return (
              <ChannelCard
                key={def.id}
                def={def}
                enabled={consent[def.id]}
                blocked={blocked}
                overridden={overridden}
                onToggle={(enabled) => updateConsent({ ...consent, [def.id]: enabled })}
                onOverride={() => updateOverrides([...overrides, def.id])}
              />
            );
          })}
        </fieldset>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/probe/live"
            aria-disabled={!acknowledged || !anyEnabled}
            className={
              !acknowledged || !anyEnabled
                ? "cursor-not-allowed rounded-lg bg-probe-surface2 px-5 py-3 text-sm font-semibold text-probe-muted"
                : "rounded-lg bg-probe-accent px-5 py-3 text-sm font-semibold text-probe-bg shadow-glow-probe"
            }
            onClick={(e) => {
              if (!acknowledged || !anyEnabled) e.preventDefault();
            }}
          >
            Continue to Live Fusion Dashboard →
          </Link>
          <Link
            href="/probe/incident"
            aria-disabled={!acknowledged}
            className={
              !acknowledged
                ? "cursor-not-allowed rounded-lg border border-probe-border px-5 py-3 text-sm font-medium text-probe-muted"
                : "rounded-lg border border-probe-accent px-5 py-3 text-sm font-semibold text-probe-accent hover:bg-probe-accent/10"
            }
            onClick={(e) => {
              if (!acknowledged) e.preventDefault();
            }}
          >
            Anomalous Incident Monitor (FFT/Frey) →
          </Link>
          <Link
            href="/probe/triangulate"
            aria-disabled={!acknowledged}
            className={
              !acknowledged
                ? "cursor-not-allowed rounded-lg border border-probe-border px-5 py-3 text-sm font-medium text-probe-muted"
                : "rounded-lg border border-probe-border px-5 py-3 text-sm font-medium text-probe-ink hover:border-probe-accent"
            }
            onClick={(e) => {
              if (!acknowledged) e.preventDefault();
            }}
          >
            TDoA Triangulation &amp; PRF Solver →
          </Link>
          <Link
            href="/probe/aep"
            aria-disabled={!acknowledged || !consent.audio}
            className={
              !acknowledged || !consent.audio
                ? "cursor-not-allowed rounded-lg border border-probe-border px-5 py-3 text-sm font-medium text-probe-muted"
                : "rounded-lg border border-probe-border px-5 py-3 text-sm font-medium text-probe-ink hover:border-probe-accent"
            }
            onClick={(e) => {
              if (!acknowledged || !consent.audio) e.preventDefault();
            }}
          >
            Go to AEP Session →
          </Link>
        </div>
        {!anyEnabled && (
          <p className="mt-3 text-xs text-probe-muted">Enable at least one channel above to continue.</p>
        )}
      </div>
    </div>
  );
}
