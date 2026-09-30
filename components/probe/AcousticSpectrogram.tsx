"use client";

import { useEffect, useRef, useState } from "react";
import type { AcousticMetrics, AcousticStreamController } from "@/lib/probe/acoustic";

interface AcousticSpectrogramProps {
  controller: AcousticStreamController | null;
  metrics: AcousticMetrics | null;
}

export function AcousticSpectrogram({ controller, metrics }: AcousticSpectrogramProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [viewMode, setViewMode] = useState<"spectrum" | "oscilloscope">("spectrum");

  useEffect(() => {
    if (!controller || !canvasRef.current) return;

    let animId = 0;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function render() {
      if (!controller || !ctx || !canvas) return;

      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = "#0b0f14";
      ctx.fillRect(0, 0, width, height);

      if (viewMode === "spectrum") {
        const data = controller.getFrequencyData();
        if (data) {
          const bufferLength = data.length;
          const barWidth = width / bufferLength;

          // Highlight ultrasonic region (15 kHz - 24 kHz)
          // 15k is approx bin 1280 out of 2048
          const ultrasonicX = (1280 / bufferLength) * width;
          ctx.fillStyle = "rgba(255, 176, 32, 0.08)";
          ctx.fillRect(ultrasonicX, 0, width - ultrasonicX, height);

          // Divider line for ultrasonic band
          ctx.strokeStyle = "rgba(255, 176, 32, 0.35)";
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(ultrasonicX, 0);
          ctx.lineTo(ultrasonicX, height);
          ctx.stroke();
          ctx.setLineDash([]);

          // Label ultrasonic band
          ctx.fillStyle = "rgba(255, 176, 32, 0.7)";
          ctx.font = "10px ui-monospace, monospace";
          ctx.fillText("ULTRASONIC (15kHz–24kHz)", ultrasonicX + 6, 14);

          // Draw spectrum bars
          for (let i = 0; i < bufferLength; i++) {
            const val = data[i]; // 0 - 255
            const barHeight = (val / 255) * (height - 20);
            const x = i * barWidth;
            const y = height - barHeight;

            if (i >= 1280) {
              // Ultrasonic band
              ctx.fillStyle = val > 160 ? "#ffb020" : "rgba(255, 176, 32, 0.65)";
            } else if (val > 190) {
              ctx.fillStyle = "#ff7a1a";
            } else {
              ctx.fillStyle = "#39ff8f";
            }

            ctx.fillRect(x, y, Math.max(1, barWidth - 0.5), barHeight);
          }
        }
      } else {
        // Oscilloscope / Time Domain
        const timeData = controller.getTimeDomainData();
        if (timeData) {
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#39ff8f";
          ctx.beginPath();

          const sliceWidth = width / timeData.length;
          let x = 0;

          for (let i = 0; i < timeData.length; i++) {
            const v = timeData[i] / 128.0; // 0 to 2
            const y = (v * height) / 2;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
            x += sliceWidth;
          }
          ctx.stroke();
        }
      }

      // Draw Grid / Frequency scale lines
      ctx.fillStyle = "rgba(147, 163, 179, 0.5)";
      ctx.font = "9px ui-monospace, monospace";
      ctx.fillText("0 Hz", 4, height - 4);
      ctx.fillText("5 kHz", width * 0.21 - 10, height - 4);
      ctx.fillText("10 kHz", width * 0.42 - 10, height - 4);
      ctx.fillText("15 kHz", width * 0.625 - 10, height - 4);
      ctx.fillText("20 kHz", width * 0.83 - 10, height - 4);
      ctx.fillText("24 kHz", width - 34, height - 4);

      animId = requestAnimationFrame(render);
    }

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [controller, viewMode]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-probe-accent">
            Real-Time 4096-Point FFT Spectrogram
          </span>
          <span className="text-[11px] font-mono text-probe-muted">
            {metrics ? `${metrics.sampleRate / 1000} kHz · 0–24 kHz span` : "Microphone idle"}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setViewMode("spectrum")}
            className={`rounded px-2 py-1 transition-colors ${
              viewMode === "spectrum"
                ? "bg-probe-accent text-probe-bg font-semibold"
                : "text-probe-muted hover:text-probe-ink"
            }`}
          >
            Spectrum (FFT)
          </button>
          <button
            type="button"
            onClick={() => setViewMode("oscilloscope")}
            className={`rounded px-2 py-1 transition-colors ${
              viewMode === "oscilloscope"
                ? "bg-probe-accent text-probe-bg font-semibold"
                : "text-probe-muted hover:text-probe-ink"
            }`}
          >
            Waveform (Scope)
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative overflow-hidden rounded-xl border border-probe-border bg-[#0b0f14]">
        <canvas
          ref={canvasRef}
          width={800}
          height={220}
          className="w-full h-[180px] sm:h-[220px] block"
        />

        {/* Live Peak Badges Overlay */}
        {metrics && (
          <div className="absolute right-3 top-3 flex flex-col gap-1.5 pointer-events-none">
            {metrics.ultrasonic.isCarrierDetected && (
              <div className="animate-pulse rounded border border-amber-400/60 bg-amber-500/20 px-2 py-1 text-[11px] font-mono font-bold text-amber-300 backdrop-blur">
                ⚠ ULTRASONIC CARRIER: {metrics.ultrasonic.peakFrequency} Hz ({metrics.ultrasonic.peakDb} dBFS)
              </div>
            )}
            {metrics.rectification.isHarmonicTrainDetected && (
              <div className="animate-pulse rounded border border-rose-500/60 bg-rose-500/20 px-2 py-1 text-[11px] font-mono font-bold text-rose-300 backdrop-blur">
                ⚡ RECTIFICATION PULSE TRAIN: ~{metrics.rectification.estimatedPrfHz} Hz ({metrics.rectification.harmonicPeakCount} harmonics)
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
