"use client";

import { useEffect, useRef, useState } from "react";
import { PpgEngine } from "@/lib/probe/ppg";
import type { HrEstimate, PpgSample } from "@/lib/probe/types";
import { SvgSparkline } from "./SvgSparkline";

export function PpgPanel({
  active,
  onHrUpdate,
  onSample,
  engineRef,
}: {
  active: boolean;
  onHrUpdate?: (hr: HrEstimate) => void;
  onSample?: (sample: PpgSample) => void;
  engineRef?: React.MutableRefObject<PpgEngine | null>;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const engine = useRef<PpgEngine | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hr, setHr] = useState<HrEstimate | null>(null);
  const [wave, setWave] = useState<number[]>([]);

  useEffect(() => {
    return () => {
      engine.current?.stop();
      engine.current = null;
      if (engineRef) engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function start() {
    setError(null);
    try {
      const eng = new PpgEngine({
        onSample: (s) => {
          setWave((prev) => [...prev.slice(-119), s.value]);
          onSample?.(s);
        },
        onHrUpdate: (estimate) => {
          setHr(estimate);
          onHrUpdate?.(estimate);
        },
        onError: (err) => setError(err.message),
      });
      engine.current = eng;
      if (engineRef) engineRef.current = eng;
      await eng.start(videoRef.current ?? undefined);
      setRunning(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't access the camera.");
    }
  }

  function stop() {
    engine.current?.stop();
    engine.current = null;
    if (engineRef) engineRef.current = null;
    setRunning(false);
    setWave([]);
    setHr(null);
  }

  return (
    <div className="card-probe rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-probe-accent">Camera PPG · Heart rate</h3>
        <button
          type="button"
          disabled={!active}
          onClick={running ? stop : start}
          className="rounded-md border border-probe-border px-3 py-1.5 text-xs font-medium text-probe-ink transition-colors hover:border-probe-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          {running ? "Stop" : "Start"}
        </button>
      </div>

      {!active && <p className="mt-2 text-xs text-probe-muted">Enable the Camera channel on the consent gate to use this.</p>}
      {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}

      <div className="mt-4 flex items-center gap-4">
        <video
          ref={videoRef}
          className="h-16 w-16 rounded-lg border border-probe-border object-cover"
          muted
          playsInline
        />
        <div>
          <p className="text-3xl font-bold tabular-nums text-probe-ink">
            {hr?.bpm ?? "—"} <span className="text-sm font-normal text-probe-muted">bpm</span>
          </p>
          <p className="mt-0.5 text-xs text-probe-muted">
            RMSSD {hr?.rmssd ?? "—"} ms · SDNN {hr?.sdnn ?? "—"} ms
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-probe-muted">Raw signal</p>
      <div className="mt-1">
        <SvgSparkline data={wave} height={56} stroke="#ff7a1a" />
      </div>

      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-probe-muted">RR tachogram (ms)</p>
      <div className="mt-1">
        <SvgSparkline data={hr ? [...hr.rrIntervals].reverse() : []} height={56} stroke="#ffb020" />
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-probe-muted/70">
        Cover your rear camera fully with a fingertip in steady light. This is a hand-rolled peak-detection
        estimate, not a validated pulse oximeter — accuracy varies with motion, lighting, and skin contact.
      </p>
    </div>
  );
}
