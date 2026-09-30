"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AepRunner as AepEngine,
  DEFAULT_AEP_CONFIG,
  averageEpochs,
  buildEpochs,
} from "@/lib/probe/aep";
import { computeFusionScore } from "@/lib/probe/fusion";
import { buildSession, downloadSession } from "@/lib/probe/fusion";
import { defaultConsent, loadConsent, loadOverrides } from "@/lib/probe/consent";
import type { AepEpoch, AepStimulus, ChannelId, ConsentMap, FusionScore } from "@/lib/probe/types";
import { PpgEngine } from "@/lib/probe/ppg";
import { MotionEngine } from "@/lib/probe/motion";
import { PpgPanel } from "./PpgPanel";
import { MotionPanel } from "./MotionPanel";

type Phase = "setup" | "running" | "review";

function mergeTraces(
  standard: { dt: number[]; value: number[] },
  deviant: { dt: number[]; value: number[] }
) {
  return standard.dt.map((dt, i) => ({
    dt,
    standard: Number.isFinite(standard.value[i]) ? standard.value[i] : null,
    deviant: Number.isFinite(deviant.value[i]) ? deviant.value[i] : null,
  }));
}

export function AepRunner() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [trialCount, setTrialCount] = useState(DEFAULT_AEP_CONFIG.trialCount);
  const [stimuli, setStimuli] = useState<AepStimulus[]>([]);
  const [epochs, setEpochs] = useState<AepEpoch[]>([]);
  const [fusionScore, setFusionScore] = useState<FusionScore | null>(null);
  const [consent, setConsent] = useState<ConsentMap>(defaultConsent());
  const [overrides, setOverrides] = useState<ChannelId[]>([]);

  const ppgEngineRef = useRef<PpgEngine | null>(null);
  const motionEngineRef = useRef<MotionEngine | null>(null);
  const runnerRef = useRef<AepEngine | null>(null);

  useEffect(() => {
    setConsent(loadConsent());
    setOverrides(loadOverrides());
  }, []);

  async function handleBegin() {
    setStimuli([]);
    setEpochs([]);
    setFusionScore(null);
    setPhase("running");

    const runner = new AepEngine(
      { trialCount },
      {
        onStimulus: (s) => setStimuli((prev) => [...prev, s]),
        onComplete: (all) => {
          const built = buildEpochs(all, ppgEngineRef.current, motionEngineRef.current);
          setEpochs(built);
          setFusionScore(computeFusionScore(built));
          setPhase("review");
        },
      }
    );
    runnerRef.current = runner;
    await runner.run();
  }

  function handleStop() {
    runnerRef.current?.stop();
    setPhase("setup");
  }

  function handleExport() {
    const session = buildSession({
      startedAt: new Date().toISOString(),
      consent,
      overriddenChannels: overrides,
      hr: null,
      ppgSamples: [],
      motionSamples: [],
      aepStimuli: stimuli,
      aepEpochs: epochs,
    });
    downloadSession(session);
  }

  const ppgTraces =
    phase === "review"
      ? mergeTraces(averageEpochs(epochs, "standard", "ppg"), averageEpochs(epochs, "deviant", "ppg"))
      : [];
  const motionTraces =
    phase === "review"
      ? mergeTraces(averageEpochs(epochs, "standard", "motion"), averageEpochs(epochs, "deviant", "motion"))
      : [];

  const deviantCount = stimuli.filter((s) => s.kind === "deviant").length;

  return (
    <div className="side-probe bg-probe-gradient min-h-full">
      <div className="mx-auto max-w-4xl px-4 pb-24 pt-10 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-probe-accent">
          NeuraProbe · Oddball AEP Session
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-probe-ink sm:text-4xl">Evoked-response proxy test</h1>
        <p className="mt-2 max-w-2xl text-sm text-probe-muted">
          Standard 1000Hz tones with occasional 1500Hz &ldquo;oddball&rdquo; deviants. We time-stamp every
          tone and epoch whatever camera/motion channels are active around each onset, then average by
          condition. This is a cardiovascular/motion micro-reaction + audio-timing{" "}
          <strong>proxy</strong> — not real EEG (no N100/P300 electrophysiology) unless a BLE EEG-capable
          device is connected, which is out of scope for this browser-only build.
        </p>

        {!consent.audio && (
          <p className="mt-4 rounded-lg border border-probe-accent2/40 bg-probe-accent2/10 p-3 text-sm text-probe-accent2">
            Audio wasn&apos;t enabled on the{" "}
            <Link href="/probe" className="underline">
              consent gate
            </Link>
            . You can still preview this page, but tones won&apos;t play until you enable it there.
          </p>
        )}

        {phase === "setup" && (
          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <PpgPanel active={consent.camera} engineRef={ppgEngineRef} />
            <MotionPanel active={consent.motion} engineRef={motionEngineRef} />
          </div>
        )}

        <div className="card-probe mt-6 rounded-2xl p-5">
          {phase === "setup" && (
            <>
              <label className="block text-xs font-medium uppercase tracking-wide text-probe-muted">
                Number of trials
              </label>
              <input
                type="number"
                min={10}
                max={80}
                value={trialCount}
                onChange={(e) => setTrialCount(Number(e.target.value) || DEFAULT_AEP_CONFIG.trialCount)}
                className="mt-1.5 w-28 rounded-md border border-probe-border bg-black/30 px-2.5 py-1.5 text-sm text-probe-ink focus:border-probe-accent focus:outline-none"
              />
              <p className="mt-3 text-xs text-probe-muted">
                Optional: start the camera/motion panels above first so they have data to epoch. Then begin —
                you&apos;ll hear a tone roughly every second for ~{Math.round((trialCount * 1.2) / 1)}s.
              </p>
              <button
                type="button"
                onClick={handleBegin}
                disabled={!consent.audio}
                className="mt-4 rounded-lg bg-probe-accent px-5 py-2.5 text-sm font-semibold text-probe-bg shadow-glow-probe disabled:cursor-not-allowed disabled:opacity-40"
              >
                Begin AEP session
              </button>
            </>
          )}

          {phase === "running" && (
            <>
              <p className="text-sm font-medium text-probe-ink">
                Trial {stimuli.length} / {trialCount} · {deviantCount} deviant tone{deviantCount === 1 ? "" : "s"} so far
              </p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/30">
                <div
                  className="h-full bg-probe-accent transition-[width]"
                  style={{ width: `${(stimuli.length / trialCount) * 100}%` }}
                />
              </div>
              <button
                type="button"
                onClick={handleStop}
                className="mt-4 rounded-lg border border-rose-500/50 px-4 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/10"
              >
                ⏹ Stop session
              </button>
            </>
          )}

          {phase === "review" && fusionScore && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wide text-probe-muted">Fusion evoked score</p>
                  <p className="text-4xl font-bold tabular-nums text-probe-ink">{fusionScore.overall}<span className="text-lg text-probe-muted">/100</span></p>
                </div>
                <div className="flex gap-4 text-sm text-probe-muted">
                  <span>PPG consistency: {fusionScore.channels.ppg ?? "n/a"}</span>
                  <span>Motion consistency: {fusionScore.channels.motion ?? "n/a"}</span>
                  <span>{fusionScore.trialCount} trials</span>
                </div>
              </div>
              {fusionScore.notes.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-probe-muted/80">
                  {fusionScore.notes.map((n, i) => (
                    <li key={i}>⚠ {n}</li>
                  ))}
                </ul>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setPhase("setup")}
                  className="rounded-lg border border-probe-border px-4 py-2 text-sm font-medium text-probe-ink hover:border-probe-accent"
                >
                  Run again
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  className="rounded-lg border border-probe-border px-4 py-2 text-sm font-medium text-probe-ink hover:border-probe-accent"
                >
                  ⬇ Export session JSON
                </button>
              </div>
            </>
          )}
        </div>

        {phase === "review" && (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <EpochChart title="PPG evoked-response proxy (avg by condition)" data={ppgTraces} />
            <EpochChart title="Motion evoked-response proxy (avg by condition)" data={motionTraces} />
          </div>
        )}
      </div>
    </div>
  );
}

function EpochChart({
  title,
  data,
}: {
  title: string;
  data: Array<{ dt: number; standard: number | null; deviant: number | null }>;
}) {
  const hasData = data.some((d) => d.standard !== null || d.deviant !== null);
  return (
    <div className="card-probe rounded-2xl p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-probe-accent">{title}</h3>
      {!hasData ? (
        <p className="mt-6 text-sm text-probe-muted">No data captured for this channel during the run.</p>
      ) : (
        <div className="mt-3 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid stroke="#28343f" strokeDasharray="3 3" />
              <XAxis
                dataKey="dt"
                tick={{ fill: "#93a3b3", fontSize: 11 }}
                label={{ value: "ms from stimulus onset", position: "insideBottom", offset: -4, fill: "#93a3b3", fontSize: 11 }}
              />
              <YAxis tick={{ fill: "#93a3b3", fontSize: 11 }} width={40} />
              <Tooltip contentStyle={{ background: "#121821", border: "1px solid #28343f", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="standard" stroke="#5c7c99" dot={false} strokeWidth={2} name="Standard (1000Hz)" connectNulls />
              <Line type="monotone" dataKey="deviant" stroke="#ffb020" dot={false} strokeWidth={2} name="Deviant (1500Hz)" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
