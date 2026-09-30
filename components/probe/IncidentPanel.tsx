"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  startAcousticAnalyzer,
  type AcousticMetrics,
  type AcousticStreamController,
} from "@/lib/probe/acoustic";
import {
  createIncidentRecord,
  deleteIncident,
  exportIncidentsJson,
  loadIncidents,
  saveIncident,
  type IncidentRecord,
  type IncidentSeverity,
} from "@/lib/probe/incident";
import type { HrEstimate, MotionProxy } from "@/lib/probe/types";
import { MotionEngine, requestMotionPermission, isMotionSupported } from "@/lib/probe/motion";
import { AcousticSpectrogram } from "./AcousticSpectrogram";
import clsx from "@/lib/clsx";

export function IncidentPanel() {
  const [isMicActive, setIsMicActive] = useState(false);
  const [isMotionActive, setIsMotionActive] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [motionError, setMotionError] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<AcousticMetrics | null>(null);
  const [motionProxy, setMotionProxy] = useState<MotionProxy | null>(null);
  const [hrEstimate] = useState<HrEstimate | null>(null);

  const [autoTrigger, setAutoTrigger] = useState(true);
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [lastIncidentTime, setLastIncidentTime] = useState<number>(0);

  const controllerRef = useRef<AcousticStreamController | null>(null);
  const motionEngineRef = useRef<MotionEngine | null>(null);

  useEffect(() => {
    setIncidents(loadIncidents());
  }, []);

  // Compute live threat severity based on sensor thresholds
  let severity: IncidentSeverity = "normal";
  let alertReason = "Ambient background normal";

  if (metrics?.rectification.isHarmonicTrainDetected && metrics?.ultrasonic.isCarrierDetected) {
    severity = "critical";
    alertReason = `Combined Ultrasonic Carrier (${metrics.ultrasonic.peakFrequency} Hz) & Rectification Pulse Train (~${metrics.rectification.estimatedPrfHz} Hz)`;
  } else if (metrics?.rectification.isHarmonicTrainDetected) {
    severity = "anomaly";
    alertReason = `Periodic Harmonic Pulse Train (~${metrics.rectification.estimatedPrfHz} Hz PRF) — Potential RF Rectification or Parametric Demodulation`;
  } else if (metrics?.ultrasonic.isCarrierDetected) {
    severity = "warning";
    alertReason = `Ultrasonic Tone Detected (${metrics.ultrasonic.peakFrequency} Hz, ${metrics.ultrasonic.peakDb} dBFS)`;
  } else if (motionProxy && motionProxy.tension > 85) {
    severity = "warning";
    alertReason = "Acute Postural Tremor / Vestibular Sway Spike";
  }

  const handleCaptureIncident = useCallback(
    (reason?: string, sev?: IncidentSeverity) => {
      const record = createIncidentRecord({
        severity: sev ?? severity,
        triggerReason: reason ?? (alertReason || "Manual Snapshot Captured"),
        acousticMetrics: metrics,
        motionProxy: motionProxy,
        hrEstimate: hrEstimate,
      });
      saveIncident(record);
      setIncidents(loadIncidents());
    },
    [severity, alertReason, metrics, motionProxy, hrEstimate]
  );

  // Auto-trigger incident logger if threshold exceeded (debounce 10s)
  useEffect(() => {
    if (!autoTrigger) return;
    if (severity === "anomaly" || severity === "critical") {
      const now = Date.now();
      if (now - lastIncidentTime > 10000) {
        setLastIncidentTime(now);
        handleCaptureIncident(alertReason, severity);
      }
    }
  }, [severity, alertReason, autoTrigger, lastIncidentTime, handleCaptureIncident]);

  async function toggleMic() {
    if (isMicActive) {
      controllerRef.current?.stop();
      controllerRef.current = null;
      setIsMicActive(false);
      setMetrics(null);
    } else {
      setMicError(null);
      try {
        const ctrl = await startAcousticAnalyzer((m) => {
          setMetrics(m);
        });
        controllerRef.current = ctrl;
        setIsMicActive(true);
      } catch (err) {
        setMicError(err instanceof Error ? err.message : "Failed to access microphone.");
      }
    }
  }

  async function toggleMotion() {
    if (isMotionActive) {
      motionEngineRef.current?.stop();
      motionEngineRef.current = null;
      setIsMotionActive(false);
      setMotionProxy(null);
    } else {
      setMotionError(null);
      if (!isMotionSupported()) {
        setMotionError("DeviceMotion is not supported on this browser/device.");
        return;
      }
      try {
        const permission = await requestMotionPermission();
        if (permission === "denied") {
          setMotionError("Motion permission denied by user gesture.");
          return;
        }
        const eng = new MotionEngine({
          onProxyUpdate: (p) => setMotionProxy(p),
        });
        eng.start();
        motionEngineRef.current = eng;
        setIsMotionActive(true);
      } catch (err) {
        setMotionError(err instanceof Error ? err.message : "Motion sensor not supported or denied.");
      }
    }
  }

  function handleDelete(id: string) {
    deleteIncident(id);
    setIncidents(loadIncidents());
  }

  function handleExport() {
    exportIncidentsJson(incidents);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      controllerRef.current?.stop();
      motionEngineRef.current?.stop();
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-probe-border bg-probe-surface px-2.5 py-1 text-xs font-mono font-semibold uppercase tracking-wider text-probe-accent">
            NeuraProbe · Anomaly &amp; Incident Suite
          </span>
          <span className="text-xs text-probe-muted">Acoustic, Ultrasonic &amp; Frey Effect Monitor</span>
        </div>
        <h1 className="text-3xl font-semibold text-probe-ink sm:text-4xl">
          Anomalous Signal &amp; Incident Monitor
        </h1>
        <p className="max-w-3xl text-sm text-probe-muted">
          Real-time forensic telemetry for detecting <strong>ultrasonic carriers (15–24 kHz)</strong>,
          <strong> periodic harmonic pulse trains</strong> (audio rectification signature of pulsed RF/microwaves),
          and <strong>vestibular postural tremor</strong>.
        </p>
      </div>

      {/* Sensor Activation Bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-probe-border bg-probe-surface p-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={toggleMic}
            className={clsx(
              "rounded-lg px-4 py-2 text-sm font-semibold transition-all",
              isMicActive
                ? "bg-rose-500/20 border border-rose-500/60 text-rose-300"
                : "bg-probe-accent text-probe-bg shadow-glow-probe hover:brightness-110"
            )}
          >
            {isMicActive ? "⏹ Stop Acoustic Analyzer" : "▶ Start Acoustic Analyzer (Mic)"}
          </button>

          <button
            type="button"
            onClick={toggleMotion}
            className={clsx(
              "rounded-lg px-4 py-2 text-sm font-semibold transition-all border",
              isMotionActive
                ? "bg-rose-500/20 border-rose-500/60 text-rose-300"
                : "border-probe-border bg-probe-surface2 text-probe-ink hover:border-probe-accent"
            )}
          >
            {isMotionActive ? "⏹ Stop Motion/Tremor" : "▶ Track Vestibular Tremor"}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-probe-muted cursor-pointer">
            <input
              type="checkbox"
              checked={autoTrigger}
              onChange={(e) => setAutoTrigger(e.target.checked)}
              className="accent-probe-accent"
            />
            Auto-log on anomalous spike
          </label>
          <button
            type="button"
            onClick={() => handleCaptureIncident()}
            className="rounded-lg border border-probe-accent/50 bg-probe-accent/10 px-3 py-1.5 text-xs font-semibold text-probe-accent hover:bg-probe-accent/20"
          >
            ⚡ Freeze Snapshot
          </button>
        </div>
      </div>

      {micError && (
        <div className="mt-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
          Acoustic Error: {micError} (Ensure microphone permissions are allowed in browser settings).
        </div>
      )}
      {motionError && (
        <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-300">
          Motion Sensor Notice: {motionError}
        </div>
      )}

      {/* Live Threat Severity Banner */}
      <div
        className={clsx(
          "mt-6 rounded-2xl border p-4 transition-all",
          severity === "critical"
            ? "border-rose-500 bg-rose-500/15 shadow-glow"
            : severity === "anomaly"
            ? "border-orange-500 bg-orange-500/15 shadow-glow-probe"
            : severity === "warning"
            ? "border-amber-500 bg-amber-500/10"
            : "border-probe-border bg-probe-surface/50"
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={clsx(
                "h-3 w-3 rounded-full animate-ping",
                severity === "critical"
                  ? "bg-rose-500"
                  : severity === "anomaly"
                  ? "bg-orange-500"
                  : severity === "warning"
                  ? "bg-amber-400"
                  : "bg-emerald-400"
              )}
            />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-probe-ink">
              Status: {severity.toUpperCase()}
            </span>
          </div>
          <span className="text-xs text-probe-muted">
            {isMicActive ? "Live Sensors Processing" : "Sensors Idle — Click Start to Monitor"}
          </span>
        </div>
        <p className="mt-1 text-sm font-medium text-probe-ink">{alertReason}</p>
      </div>

      {/* Real-time Spectrogram */}
      <div className="mt-6 rounded-2xl border border-probe-border bg-probe-surface p-5">
        <AcousticSpectrogram controller={controllerRef.current} metrics={metrics} />
      </div>

      {/* Telemetry Metrics Grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Ultrasonic Band */}
        <div className="rounded-2xl border border-probe-border bg-probe-surface p-4">
          <div className="text-[11px] font-mono uppercase tracking-wider text-probe-muted">
            Ultrasonic Peak (15–24 kHz)
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-probe-ink">
            {metrics ? `${metrics.ultrasonic.peakFrequency} Hz` : "—"}
          </div>
          <div className="mt-1 text-xs text-probe-muted">
            Power: {metrics ? `${metrics.ultrasonic.peakDb} dBFS` : "—"} ·{" "}
            <span
              className={
                metrics?.ultrasonic.isCarrierDetected ? "font-bold text-amber-400" : "text-probe-muted"
              }
            >
              {metrics?.ultrasonic.isCarrierDetected ? "Carrier Detected" : "Floor Quiet"}
            </span>
          </div>
        </div>

        {/* Pulse Repetition / Rectification */}
        <div className="rounded-2xl border border-probe-border bg-probe-surface p-4">
          <div className="text-[11px] font-mono uppercase tracking-wider text-probe-muted">
            Rectification / PRF Train
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-probe-ink">
            {metrics?.rectification.estimatedPrfHz
              ? `~${metrics.rectification.estimatedPrfHz} Hz`
              : "None"}
          </div>
          <div className="mt-1 text-xs text-probe-muted">
            Harmonics: {metrics ? metrics.rectification.harmonicPeakCount : 0} · Crest:{" "}
            {metrics ? `${metrics.rectification.crestFactor}x` : "—"}
          </div>
        </div>

        {/* Overall Sound Pressure */}
        <div className="rounded-2xl border border-probe-border bg-probe-surface p-4">
          <div className="text-[11px] font-mono uppercase tracking-wider text-probe-muted">
            Acoustic Peak / RMS
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-probe-ink">
            {metrics ? `${metrics.peakDb} dB` : "—"}
          </div>
          <div className="mt-1 text-xs text-probe-muted">
            Peak at: {metrics ? `${metrics.peakFrequency} Hz` : "—"} · RMS:{" "}
            {metrics ? `${metrics.overallRmsDb} dBFS` : "—"}
          </div>
        </div>

        {/* Vestibular Tremor / Posture */}
        <div className="rounded-2xl border border-probe-border bg-probe-surface p-4">
          <div className="text-[11px] font-mono uppercase tracking-wider text-probe-muted">
            Vestibular Postural Sway
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-probe-ink">
            {motionProxy ? `${Math.round(motionProxy.tension)}%` : "—"}
          </div>
          <div className="mt-1 text-xs text-probe-muted">
            Asymmetry: {motionProxy ? `${Math.round(motionProxy.asymmetry)}` : "—"} · Mag:{" "}
            {motionProxy ? `${motionProxy.magnitude.toFixed(2)} m/s²` : "—"}
          </div>
        </div>
      </div>

      {/* Incident Dossier Blackbox */}
      <div className="mt-10 rounded-2xl border border-probe-border bg-probe-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-probe-border pb-4">
          <div>
            <h2 className="text-base font-semibold text-probe-ink">Forensic Incident Dossier</h2>
            <p className="text-xs text-probe-muted">
              Tamper-evident, local-only blackbox log capturing timestamped snapshots of anomalous acoustic and motion telemetry.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExport}
              disabled={incidents.length === 0}
              className="rounded-lg border border-probe-accent bg-probe-accent/10 px-3 py-1.5 text-xs font-semibold text-probe-accent hover:bg-probe-accent hover:text-probe-bg disabled:opacity-40"
            >
              ⬇ Export Dossier (.JSON)
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {incidents.length === 0 ? (
            <div className="p-8 text-center text-xs text-probe-muted">
              No incidents logged yet. Start the acoustic analyzer above to monitor for anomalies, or click &ldquo;Freeze Snapshot&rdquo;.
            </div>
          ) : (
            incidents.map((inc) => (
              <div
                key={inc.id}
                className="flex flex-col gap-2 rounded-xl border border-probe-border/80 bg-probe-bg/60 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={clsx(
                        "rounded px-2 py-0.5 text-[10px] font-mono font-bold uppercase",
                        inc.severity === "critical"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                          : inc.severity === "anomaly"
                          ? "bg-orange-500/20 text-orange-300 border border-orange-500/40"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      )}
                    >
                      {inc.severity}
                    </span>
                    <span className="text-xs font-mono text-probe-muted">
                      {new Date(inc.timestamp).toLocaleTimeString()} · {new Date(inc.timestamp).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] font-mono text-probe-steel">{inc.checksum}</span>
                  </div>
                  <div className="text-xs font-medium text-probe-ink">{inc.triggerReason}</div>
                  <div className="text-[11px] text-probe-muted">
                    {inc.acoustic && (
                      <>
                        Peak: {inc.acoustic.peakFrequency} Hz ({inc.acoustic.peakDb} dB) · Ultrasonic:{" "}
                        {inc.acoustic.ultrasonicPeakFreq} Hz ({inc.acoustic.ultrasonicPeakDb} dB) · PRF:{" "}
                        {inc.acoustic.estimatedPrfHz ? `${inc.acoustic.estimatedPrfHz} Hz` : "None"}
                      </>
                    )}
                    {inc.motion && ` · Sway Tension: ${Math.round(inc.motion.tension)}%`}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDelete(inc.id)}
                    className="text-xs text-rose-400 hover:text-rose-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Physics / Educational Context */}
      <div className="mt-8 rounded-2xl border border-probe-border/60 bg-probe-surface/40 p-5 text-xs text-probe-muted space-y-2">
        <h3 className="font-semibold text-probe-accent uppercase tracking-wider text-[11px]">
          Biophysical Detection Limits &amp; Hardware Reality
        </h3>
        <p>
          • <strong>What this app senses:</strong> Standard smartphone/laptop MEMS microphones can capture
          frequencies up to 24 kHz (Nyquist cutoff at 48 kHz sampling). This allows direct detection of
          near-ultrasound carriers (15–24 kHz), acoustic intermodulation products, and audio-rectified
          harmonic trains caused when high-power pulsed RF fields induce demodulated currents in recording
          electronics.
        </p>
        <p>
          • <strong>What requires external hardware:</strong> Direct measurement of raw gigahertz microwave
          pulses (the Frey carrier) requires an external <strong>Software Defined Radio (SDR)</strong> or a fast
          Schottky diode RF dosimeter badge (e.g., US Patent 10,816,680).
        </p>
        <p>
          • For a full survey of patents and defense studies, review the{" "}
          <Link href="/patents" className="text-probe-accent underline hover:text-white">
            Electromagnetic &amp; Acoustic Patent Registry →
          </Link>
        </p>
      </div>
    </div>
  );
}
