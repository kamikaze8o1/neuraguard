// Camera-based photoplethysmography (PPG): sample the average red-channel
// intensity from a video frame, run simple peak detection to estimate BPM
// and RR intervals, and derive a basic HRV (RMSSD/SDNN) proxy.
//
// This is intentionally a hand-rolled, simple implementation — not a
// clinical-grade signal processing pipeline. Accuracy depends heavily on
// stable finger/camera contact and lighting.
import type { HrEstimate, PpgSample } from "./types";

const BUFFER_MS = 8000; // keep the last 8s of samples for peak detection
const MIN_PEAK_DISTANCE_MS = 320; // refractory period ~187bpm ceiling
const MAX_RR_HISTORY = 24;

export interface PpgEngineOptions {
  onSample?: (sample: PpgSample) => void;
  onHrUpdate?: (hr: HrEstimate) => void;
  onError?: (err: Error) => void;
}

export class PpgEngine {
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private stream: MediaStream | null = null;
  private rafId: number | null = null;
  private samples: PpgSample[] = [];
  private rrIntervals: number[] = [];
  private lastPeakT: number | null = null;
  private smoothed: number[] = [];
  private options: PpgEngineOptions;
  private running = false;

  constructor(options: PpgEngineOptions = {}) {
    this.options = options;
    this.canvas = document.createElement("canvas");
    this.canvas.width = 32;
    this.canvas.height = 32;
    this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
  }

  get isRunning(): boolean {
    return this.running;
  }

  /** @param previewEl Optional visible <video> element to attach the camera
   * stream to (so the user can align a fingertip). If omitted, an
   * off-screen video element is used. */
  async start(previewEl?: HTMLVideoElement): Promise<void> {
    if (this.running) return;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 64 }, height: { ideal: 64 } },
        audio: false,
      });
    } catch {
      // Fall back to any camera (e.g. laptop front camera) if a rear
      // "environment" camera is unavailable.
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    }
    this.video = previewEl ?? document.createElement("video");
    this.video.srcObject = this.stream;
    this.video.playsInline = true;
    this.video.muted = true;
    await this.video.play();
    this.running = true;
    this.loop();
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    if (this.video) this.video.srcObject = null;
    this.video = null;
    this.samples = [];
    this.rrIntervals = [];
    this.lastPeakT = null;
    this.smoothed = [];
  }

  private loop = () => {
    if (!this.running || !this.video || !this.ctx) return;
    try {
      this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
      const frame = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      let sum = 0;
      for (let i = 0; i < frame.data.length; i += 4) {
        sum += frame.data[i]; // red channel
      }
      const avgRed = sum / (frame.data.length / 4);
      const t = performance.now();
      this.pushSample({ t, value: avgRed });
    } catch (err) {
      this.options.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
    this.rafId = requestAnimationFrame(this.loop);
  };

  private pushSample(sample: PpgSample): void {
    this.samples.push(sample);
    const cutoff = sample.t - BUFFER_MS;
    while (this.samples.length && this.samples[0].t < cutoff) this.samples.shift();
    this.options.onSample?.(sample);
    this.detectPeak(sample);
  }

  private detectPeak(sample: PpgSample): void {
    // Simple moving-average smoothing (window ~5 samples) then a
    // rising-edge-above-rolling-baseline peak detector with a refractory
    // period to avoid double-counting noise.
    this.smoothed.push(sample.value);
    if (this.smoothed.length > 5) this.smoothed.shift();
    const smoothedValue = this.smoothed.reduce((a, b) => a + b, 0) / this.smoothed.length;

    const recentWindow = this.samples.slice(-90); // ~1.5s at 60fps
    if (recentWindow.length < 10) return;
    const mean = recentWindow.reduce((a, s) => a + s.value, 0) / recentWindow.length;
    const variance =
      recentWindow.reduce((a, s) => a + (s.value - mean) ** 2, 0) / recentWindow.length;
    const std = Math.sqrt(variance);
    const threshold = mean + std * 0.6;

    const withinRefractory =
      this.lastPeakT !== null && sample.t - this.lastPeakT < MIN_PEAK_DISTANCE_MS;

    if (smoothedValue > threshold && !withinRefractory && std > 0.05) {
      if (this.lastPeakT !== null) {
        const rr = sample.t - this.lastPeakT;
        if (rr > 260 && rr < 2000) {
          this.rrIntervals.unshift(rr);
          if (this.rrIntervals.length > MAX_RR_HISTORY) this.rrIntervals.pop();
          this.emitHr();
        }
      }
      this.lastPeakT = sample.t;
    }
  }

  private emitHr(): void {
    if (this.rrIntervals.length < 2) return;
    const recent = this.rrIntervals.slice(0, 8);
    const avgRr = recent.reduce((a, b) => a + b, 0) / recent.length;
    const bpm = 60000 / avgRr;

    let rmssd: number | null = null;
    if (recent.length >= 3) {
      const diffs = recent.slice(0, -1).map((v, i) => v - recent[i + 1]);
      rmssd = Math.sqrt(diffs.reduce((a, d) => a + d * d, 0) / diffs.length);
    }
    let sdnn: number | null = null;
    if (recent.length >= 3) {
      const mean = avgRr;
      sdnn = Math.sqrt(recent.reduce((a, v) => a + (v - mean) ** 2, 0) / recent.length);
    }

    this.options.onHrUpdate?.({
      bpm: Math.round(bpm * 10) / 10,
      rrIntervals: [...this.rrIntervals],
      rmssd: rmssd !== null ? Math.round(rmssd * 10) / 10 : null,
      sdnn: sdnn !== null ? Math.round(sdnn * 10) / 10 : null,
      source: "camera",
      updatedAt: Date.now(),
    });
  }

  /** Returns PPG samples within [onset - beforeMs, onset + afterMs], with
   * time re-based to be relative to onset (used for AEP epoching). */
  getEpochWindow(onset: number, beforeMs: number, afterMs: number): Array<{ dt: number; value: number }> {
    return this.samples
      .filter((s) => s.t >= onset - beforeMs && s.t <= onset + afterMs)
      .map((s) => ({ dt: s.t - onset, value: s.value }));
  }
}
