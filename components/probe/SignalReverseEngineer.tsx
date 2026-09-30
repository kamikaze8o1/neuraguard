"use client";

import { useRef, useState } from "react";
import {
  analyzePcmSegment,
  reverseEngineerAudioSignal,
  type ReverseEngineeringReport,
} from "@/lib/probe/reverseEngineer";
import {
  startAcousticAnalyzer,
  type AcousticMetrics,
  type AcousticStreamController,
} from "@/lib/probe/acoustic";
import clsx from "@/lib/clsx";

export function SignalReverseEngineer() {
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [report, setReport] = useState<ReverseEngineeringReport | null>(null);
  const [liveMetrics, setLiveMetrics] = useState<AcousticMetrics | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const controllerRef = useRef<AcousticStreamController | null>(null);

  // Live stream reverse engineering
  async function toggleLiveAnalyzer() {
    if (isLiveActive) {
      controllerRef.current?.stop();
      controllerRef.current = null;
      setIsLiveActive(false);
    } else {
      setStatusMsg(null);
      try {
        const ctrl = await startAcousticAnalyzer((metrics) => {
          setLiveMetrics(metrics);
          if (metrics.topPeaks.length > 0) {
            const rep = reverseEngineerAudioSignal(
              metrics.topPeaks,
              metrics.sampleRate,
              metrics.ultrasonic.isCarrierDetected,
              metrics.rectification.crestFactor
            );
            setReport(rep);
          }
        });
        controllerRef.current = ctrl;
        setIsLiveActive(true);
      } catch (err) {
        setStatusMsg(err instanceof Error ? err.message : "Failed to access audio device.");
      }
    }
  }

  // Audio file upload and offline analysis
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMsg("Decoding audio file...");
    try {
      if (file.name.toLowerCase().endsWith(".json") || file.type === "application/json") {
        const text = await file.text();
        const parsed = JSON.parse(text) as {
          incidents?: Array<{ acoustic?: { topPeaks?: Array<{ freq: number; db: number }>; crestFactor?: number; isCarrierDetected?: boolean } }>;
          acoustic?: { topPeaks?: Array<{ freq: number; db: number }>; crestFactor?: number; isCarrierDetected?: boolean };
          fundamentalPrfHz?: number;
        };
        if (typeof parsed.fundamentalPrfHz === "number") {
          setReport(parsed as ReverseEngineeringReport);
          setStatusMsg(`Loaded report "${file.name}".`);
          return;
        }
        const acoustic = parsed.incidents?.[0]?.acoustic ?? parsed.acoustic;
        if (!acoustic?.topPeaks?.length) {
          setStatusMsg("That JSON has no acoustic peaks to classify.");
          return;
        }
        const rep = reverseEngineerAudioSignal(
          acoustic.topPeaks,
          48000,
          Boolean(acoustic.isCarrierDetected),
          acoustic.crestFactor ?? 3
        );
        setReport(rep);
        setStatusMsg(`Classified peaks from "${file.name}".`);
        return;
      }

      const arrayBuffer = await file.arrayBuffer();
      const audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
      const channelData = audioBuffer.getChannelData(0);
      const rep = analyzePcmSegment(channelData, audioBuffer.sampleRate);
      setReport(rep);
      setStatusMsg(
        `Analyzed "${file.name}" (${audioBuffer.duration.toFixed(1)}s, ${audioBuffer.sampleRate} Hz). Pulse width is an audio-envelope estimate.`
      );
      audioCtx.close().catch(() => {});
    } catch (err) {
      setStatusMsg("Error decoding file: " + (err instanceof Error ? err.message : "Invalid format"));
    }
  }

  function handleExportJson() {
    if (!report) return;
    const json = JSON.stringify(report, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `signal-reverse-engineering-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-probe-border bg-probe-surface p-5">
        <div>
          <h2 className="text-base font-semibold text-probe-ink">
            Pulse Envelope &amp; PRF Reverse Engineering Engine
          </h2>
          <p className="text-xs text-probe-muted">
            Reads the file or the microphone. PRF comes from autocorrelation and cepstrum. Pulse width is τ ≈ 1/f_null on the audio spectrum, not a measured microwave pulse.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={toggleLiveAnalyzer}
            className={clsx(
              "rounded-lg px-4 py-2 text-xs font-semibold transition-all",
              isLiveActive
                ? "border border-rose-500/60 bg-rose-500/20 text-rose-300"
                : "bg-probe-accent text-probe-bg shadow-glow-probe hover:brightness-110"
            )}
          >
            {isLiveActive ? "⏹ Stop Live Stream" : "▶ Live Microphone Analysis"}
          </button>

          <label className="cursor-pointer rounded-lg border border-probe-border bg-probe-surface2 px-4 py-2 text-xs font-semibold text-probe-ink hover:border-probe-accent">
            📂 Upload Audio / Capture (.wav, .mp3)
            <input
              type="file"
              accept="audio/*,.wav,.mp3,.m4a,.json,application/json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {report && (
            <button
              type="button"
              onClick={handleExportJson}
              className="rounded-lg border border-probe-accent bg-probe-accent/10 px-3 py-2 text-xs font-semibold text-probe-accent hover:bg-probe-accent hover:text-probe-bg"
            >
              ⬇ Export Report JSON
            </button>
          )}
        </div>
      </div>

      {statusMsg && (
        <div className="rounded-xl border border-probe-border bg-probe-surface2 p-3 text-xs text-probe-muted">
          {statusMsg}
        </div>
      )}

      {/* Analysis Results */}
      {report ? (
        <div className="space-y-6">
          {/* Classification Banner */}
          <div
            className={clsx(
              "rounded-2xl border p-5 transition-all shadow-glow",
              report.classification.threatTier === "critical"
                ? "border-rose-500/60 bg-rose-500/15"
                : report.classification.threatTier === "high"
                ? "border-amber-500/60 bg-amber-500/15"
                : "border-probe-accent/40 bg-probe-surface"
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-black/40 text-white">
                  Match Score: {report.classification.confidenceScore}%
                </span>
                <span className="text-xs font-mono uppercase text-probe-muted">
                  Tier: {report.classification.threatTier.toUpperCase()}
                </span>
              </div>
              <span className="text-xs font-mono text-probe-muted">
                Analyzed at: {new Date(report.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <h3 className="mt-2 text-xl font-semibold text-probe-ink">
              {report.classification.profileName}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-probe-ink/90 sm:text-sm">
              {report.classification.description}
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
              <div>
                <h4 className="font-semibold uppercase tracking-wider text-probe-accent">
                  Key Spectral Signatures:
                </h4>
                <ul className="mt-1 space-y-1 text-probe-muted">
                  {report.classification.characteristics.map((c, i) => (
                    <li key={i}>• {c}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold uppercase tracking-wider text-emerald-400">
                  Defensive Countermeasures:
                </h4>
                <ul className="mt-1 space-y-1 text-probe-muted">
                  {report.classification.recommendedCountermeasures.map((cm, i) => (
                    <li key={i}>🛡 {cm}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Extracted Pulse Physics Telemetry */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-probe-border bg-probe-surface p-4">
              <div className="text-[11px] font-mono uppercase tracking-wider text-probe-muted">
                Pulse Repetition (PRF)
              </div>
              <div className="mt-2 text-3xl font-bold font-mono text-probe-ink">
                {report.fundamentalPrfHz} <span className="text-sm font-normal text-probe-muted">Hz</span>
              </div>
              <div className="mt-1 text-xs text-probe-muted">
                Interval: {report.pulseIntervalMs} ms
                {report.cepstralPrfHz ? ` · cepstrum ${report.cepstralPrfHz} Hz` : ""}
              </div>
            </div>

            <div className="rounded-2xl border border-probe-border bg-probe-surface p-4">
              <div className="text-[11px] font-mono uppercase tracking-wider text-probe-muted">
                Estimated Pulse Width (τ)
              </div>
              <div className="mt-2 text-3xl font-bold font-mono text-probe-ink">
                ~{report.estimatedPulseWidthUs} <span className="text-sm font-normal text-probe-muted">µs</span>
              </div>
              <div className="mt-1 text-xs text-probe-muted">
                Duty Cycle: ~{report.dutyCyclePercent}%
              </div>
            </div>

            <div className="rounded-2xl border border-probe-border bg-probe-surface p-4">
              <div className="text-[11px] font-mono uppercase tracking-wider text-probe-muted">
                Spectral Crest Factor
              </div>
              <div className="mt-2 text-3xl font-bold font-mono text-probe-ink">
                {report.crestFactor}x
              </div>
              <div className="mt-1 text-xs text-probe-muted">
                {report.crestFactor > 3.5 ? "Impulsive / Pulsed Carrier" : "Continuous / Quasi-steady"}
              </div>
            </div>

            <div className="rounded-2xl border border-probe-border bg-probe-surface p-4">
              <div className="text-[11px] font-mono uppercase tracking-wider text-probe-muted">
                Harmonic Comb Peaks
              </div>
              <div className="mt-2 text-3xl font-bold font-mono text-probe-ink">
                {report.harmonicCount} <span className="text-sm font-normal text-probe-muted">lines</span>
              </div>
              <div className="mt-1 text-xs text-probe-muted">
                Highest: {report.topHarmonics[report.topHarmonics.length - 1] ?? "—"} Hz
              </div>
            </div>
          </div>

          {/* Harmonic Spectrum Table */}
          <div className="rounded-2xl border border-probe-border bg-probe-surface p-5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-probe-accent">
              Demodulated Rectification Harmonic Train (Harmonic Comb)
            </h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {report.topHarmonics.map((freq, i) => (
                <span
                  key={i}
                  className="rounded-lg border border-probe-border bg-probe-bg px-3 py-1 font-mono text-xs text-probe-ink"
                >
                  <span className="text-probe-accent">H{i + 1}:</span> {freq} Hz
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-probe-border bg-probe-surface/40 p-12 text-center text-xs text-probe-muted">
          No signal analyzed yet. Click &ldquo;Live Microphone Analysis&rdquo; or upload an audio file to extract pulse parameters.
        </div>
      )}
    </div>
  );
}
