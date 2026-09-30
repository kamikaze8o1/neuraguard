"use client";

import { useEffect, useRef, useState } from "react";
import { MotionEngine, isMotionSupported, requestMotionPermission } from "@/lib/probe/motion";
import type { MotionProxy, MotionSample } from "@/lib/probe/types";
import { SvgSparkline } from "./SvgSparkline";

export function MotionPanel({
  active,
  onSample,
  engineRef,
}: {
  active: boolean;
  onSample?: (sample: MotionSample) => void;
  engineRef?: React.MutableRefObject<MotionEngine | null>;
}) {
  const engine = useRef<MotionEngine | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proxy, setProxy] = useState<MotionProxy | null>(null);
  const [wave, setWave] = useState<number[]>([]);
  const supported = isMotionSupported();

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
    const permission = await requestMotionPermission();
    if (permission === "denied") {
      setError("Motion permission denied. iOS requires an explicit tap to allow motion sensors.");
      return;
    }
    if (permission === "unsupported") {
      setError("DeviceMotion is not supported on this browser/device.");
      return;
    }
    const eng = new MotionEngine({
      onSample,
      onProxyUpdate: (p) => {
        setProxy(p);
        setWave((prev) => [...prev.slice(-119), p.magnitude]);
      },
    });
    engine.current = eng;
    if (engineRef) engineRef.current = eng;
    eng.start();
    setRunning(true);
  }

  function stop() {
    engine.current?.stop();
    engine.current = null;
    if (engineRef) engineRef.current = null;
    setRunning(false);
    setWave([]);
    setProxy(null);
  }

  return (
    <div className="card-probe rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-probe-accent">
          Motion · Scapular proxy
        </h3>
        <button
          type="button"
          disabled={!active || !supported}
          onClick={running ? stop : start}
          className="rounded-md border border-probe-border px-3 py-1.5 text-xs font-medium text-probe-ink transition-colors hover:border-probe-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          {running ? "Stop" : "Start"}
        </button>
      </div>

      {!active && <p className="mt-2 text-xs text-probe-muted">Enable the Motion channel on the consent gate to use this.</p>}
      {!supported && <p className="mt-2 text-xs text-rose-300">Not supported on this browser/device.</p>}
      {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-2xl font-bold tabular-nums text-probe-ink">{proxy?.tension ?? "—"}</p>
          <p className="text-xs text-probe-muted">Tension proxy (0-100)</p>
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums text-probe-ink">{proxy?.asymmetry ?? "—"}</p>
          <p className="text-xs text-probe-muted">Asymmetry proxy (-100..100)</p>
        </div>
      </div>

      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-probe-muted">Acceleration magnitude</p>
      <div className="mt-1">
        <SvgSparkline data={wave} height={56} stroke="#5c7c99" />
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-probe-muted/70">
        Hold or strap your phone against your upper back. This is an accelerometer/gyroscope proxy for
        tension and asymmetry — it is <strong>not real EMG</strong> and should not be treated as a clinical
        measurement.
      </p>
    </div>
  );
}
