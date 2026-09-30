"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { defaultConsent, loadConsent, loadOverrides } from "@/lib/probe/consent";
import type { ChannelId, ConsentMap, HrEstimate, MotionSample, PpgSample, BleHrReading } from "@/lib/probe/types";
import { buildSession, downloadSession } from "@/lib/probe/fusion";
import { PpgPanel } from "./PpgPanel";
import { MotionPanel } from "./MotionPanel";
import { BlePanel } from "./BlePanel";

const MAX_BUFFERED_SAMPLES = 2000;

export function FusionDashboard() {
  const [sessionKey, setSessionKey] = useState(0);
  const [startedAt] = useState(() => new Date().toISOString());
  const [cameraHr, setCameraHr] = useState<HrEstimate | null>(null);
  const [bleHr, setBleHr] = useState<BleHrReading | null>(null);
  const [ppgSamples, setPpgSamples] = useState<PpgSample[]>([]);
  const [motionSamples, setMotionSamples] = useState<MotionSample[]>([]);
  const [consent, setConsent] = useState<ConsentMap>(defaultConsent());
  const [overrides, setOverrides] = useState<ChannelId[]>([]);

  useEffect(() => {
    setConsent(loadConsent());
    setOverrides(loadOverrides());
  }, []);

  const fusedBpm = bleHr?.bpm ?? cameraHr?.bpm ?? null;
  const fusedSource = bleHr ? "Bluetooth" : cameraHr ? "Camera PPG" : "—";

  function handleStopAll() {
    setSessionKey((k) => k + 1);
    setCameraHr(null);
    setBleHr(null);
  }

  function handleExport() {
    const session = buildSession({
      startedAt,
      consent,
      overriddenChannels: overrides,
      hr: bleHr
        ? { bpm: bleHr.bpm, rrIntervals: bleHr.rrIntervals ?? [], rmssd: null, sdnn: null, source: "bluetooth", updatedAt: Date.now() }
        : cameraHr,
      ppgSamples,
      motionSamples,
      aepStimuli: [],
      aepEpochs: [],
    });
    downloadSession(session);
  }

  return (
    <div className="side-probe bg-probe-gradient min-h-full">
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-probe-accent">
              NeuraProbe · Live Fusion
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-probe-ink sm:text-4xl">
              {fusedBpm ?? "—"} <span className="text-lg font-normal text-probe-muted">bpm fused ({fusedSource})</span>
            </h1>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleExport}
              className="rounded-lg border border-probe-border px-4 py-2 text-sm font-medium text-probe-ink hover:border-probe-accent"
            >
              ⬇ Export session JSON
            </button>
            <button
              type="button"
              onClick={handleStopAll}
              className="rounded-lg border border-rose-500/50 px-4 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/10"
            >
              ⏹ Stop all sensors
            </button>
          </div>
        </div>

        <p className="mt-2 text-sm text-probe-muted">
          Nothing starts without your explicit tap on each panel below, and everything stops the moment you
          click &ldquo;Stop all sensors&rdquo;.{" "}
          <Link href="/probe" className="underline hover:text-probe-ink">
            Back to consent gate
          </Link>
        </p>

        <div key={sessionKey} className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <PpgPanel
            active={consent.camera}
            onHrUpdate={setCameraHr}
            onSample={(s) => setPpgSamples((prev) => [...prev.slice(-MAX_BUFFERED_SAMPLES), s])}
          />
          <MotionPanel
            active={consent.motion}
            onSample={(s) => setMotionSamples((prev) => [...prev.slice(-MAX_BUFFERED_SAMPLES), s])}
          />
          <BlePanel active={consent.bluetooth} onReading={setBleHr} />

          <div className="card-probe rounded-2xl p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-probe-accent">Session notes</h3>
            <ul className="mt-3 space-y-2 text-sm text-probe-muted">
              <li>Camera: {consent.camera ? "enabled" : "disabled"} on the consent gate.</li>
              <li>Motion: {consent.motion ? "enabled" : "disabled"} on the consent gate.</li>
              <li>Bluetooth: {consent.bluetooth ? "enabled" : "disabled"} on the consent gate.</li>
              {overrides.length > 0 && (
                <li className="text-probe-accent2">
                  Charter override active for: {overrides.join(", ")}
                </li>
              )}
            </ul>
            <p className="mt-3 text-xs text-probe-muted/70">
              Want to run the oddball evoked-response test with these channels active?{" "}
              <Link href="/probe/aep" className="text-probe-accent underline">
                Go to AEP Session →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
