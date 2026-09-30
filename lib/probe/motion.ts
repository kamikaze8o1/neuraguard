// DeviceMotion/DeviceOrientation-based "scapular tension/asymmetry proxy".
//
// IMPORTANT: this is a proxy built from phone accelerometer/gyroscope data,
// NOT real EMG. It is only meaningful if the phone is held/strapped against
// the upper back as described in the UI copy.
import type { MotionProxy, MotionSample } from "./types";

const BUFFER_MS = 6000;

export interface MotionEngineOptions {
  onSample?: (sample: MotionSample) => void;
  onProxyUpdate?: (proxy: MotionProxy) => void;
}

export type MotionPermissionState = "unnecessary" | "granted" | "denied" | "unsupported";

/** iOS 13+ requires a user-gesture-triggered permission request before
 * DeviceMotionEvent fires. Other browsers don't need this at all. */
export async function requestMotionPermission(): Promise<MotionPermissionState> {
  if (typeof window.DeviceMotionEvent === "undefined") return "unsupported";
  const requestPermission = window.DeviceMotionEvent.requestPermission;
  if (typeof requestPermission === "function") {
    try {
      const result = await requestPermission();
      return result === "granted" ? "granted" : "denied";
    } catch {
      return "denied";
    }
  }
  return "unnecessary";
}

export class MotionEngine {
  private samples: MotionSample[] = [];
  private options: MotionEngineOptions;
  private running = false;
  private handleMotion = (event: DeviceMotionEvent) => {
    const acc = event.accelerationIncludingGravity ?? event.acceleration;
    if (!acc) return;
    const sample: MotionSample = {
      t: performance.now(),
      ax: acc.x ?? 0,
      ay: acc.y ?? 0,
      az: acc.z ?? 0,
      alpha: event.rotationRate?.alpha ?? null,
      beta: event.rotationRate?.beta ?? null,
      gamma: event.rotationRate?.gamma ?? null,
    };
    this.pushSample(sample);
  };

  constructor(options: MotionEngineOptions = {}) {
    this.options = options;
  }

  get isRunning(): boolean {
    return this.running;
  }

  start(): void {
    if (this.running) return;
    window.addEventListener("devicemotion", this.handleMotion);
    this.running = true;
  }

  stop(): void {
    window.removeEventListener("devicemotion", this.handleMotion);
    this.running = false;
    this.samples = [];
  }

  private pushSample(sample: MotionSample): void {
    this.samples.push(sample);
    const cutoff = sample.t - BUFFER_MS;
    while (this.samples.length && this.samples[0].t < cutoff) this.samples.shift();
    this.options.onSample?.(sample);
    this.emitProxy(sample);
  }

  private emitProxy(sample: MotionSample): void {
    const magnitude = Math.sqrt(sample.ax ** 2 + sample.ay ** 2 + sample.az ** 2);

    const window_ = this.samples.slice(-60); // ~1s at 60hz, less on slower devices
    if (window_.length < 5) return;
    const mags = window_.map((s) => Math.sqrt(s.ax ** 2 + s.ay ** 2 + s.az ** 2));
    const meanMag = mags.reduce((a, b) => a + b, 0) / mags.length;
    const variance = mags.reduce((a, m) => a + (m - meanMag) ** 2, 0) / mags.length;
    // Tension proxy: scale rolling variance into a rough 0-100 band. The
    // scale factor is a heuristic tuned for typical handheld jitter, not a
    // calibrated clinical measure.
    const tension = Math.min(100, Math.round(variance * 40));

    const xs = window_.map((s) => s.ax);
    const meanX = xs.reduce((a, b) => a + b, 0) / xs.length;
    // Asymmetry proxy: signed lean of lateral (x-axis) acceleration,
    // scaled into -100..100. Positive = leaning/tilting right.
    const asymmetry = Math.max(-100, Math.min(100, Math.round(meanX * 15)));

    this.options.onProxyUpdate?.({ magnitude, tension, asymmetry });
  }

  getEpochWindow(onset: number, beforeMs: number, afterMs: number): Array<{ dt: number; magnitude: number }> {
    return this.samples
      .filter((s) => s.t >= onset - beforeMs && s.t <= onset + afterMs)
      .map((s) => ({ dt: s.t - onset, magnitude: Math.sqrt(s.ax ** 2 + s.ay ** 2 + s.az ** 2) }));
  }
}

export function isMotionSupported(): boolean {
  return typeof window !== "undefined" && typeof window.DeviceMotionEvent !== "undefined";
}
