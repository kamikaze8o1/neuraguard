// Oddball auditory evoked-potential (AEP) protocol: schedule "standard" and
// occasional "deviant" tones via the Web Audio API, time-stamp each onset,
// and provide epoching/averaging helpers so the UI can plot an averaged
// "evoked-response proxy" per available sensor channel.
//
// This produces a cardiovascular/motion micro-reaction + audio-timing proxy.
// It is explicitly NOT real EEG — no N100/P300 electrophysiology is
// measured unless a BLE EEG-capable device is connected (out of scope here).
import type { AepEpoch, AepStimulus } from "./types";
import type { PpgEngine } from "./ppg";
import type { MotionEngine } from "./motion";

export interface AepConfig {
  trialCount: number;
  standardFreqHz: number;
  deviantFreqHz: number;
  deviantProbability: number;
  minIsiMs: number;
  maxIsiMs: number;
  toneDurationMs: number;
}

export const DEFAULT_AEP_CONFIG: AepConfig = {
  trialCount: 30,
  standardFreqHz: 1000,
  deviantFreqHz: 1500,
  deviantProbability: 0.2,
  minIsiMs: 900,
  maxIsiMs: 1500,
  toneDurationMs: 120,
};

export const EPOCH_BEFORE_MS = 100;
export const EPOCH_AFTER_MS = 600;
export const EPOCH_BIN_MS = 20;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface AepRunnerOptions {
  onStimulus?: (stimulus: AepStimulus) => void;
  onComplete?: (stimuli: AepStimulus[]) => void;
}

export class AepRunner {
  private ctx: AudioContext | null = null;
  private stimuli: AepStimulus[] = [];
  private running = false;
  private config: AepConfig;
  private options: AepRunnerOptions;

  constructor(config: Partial<AepConfig> = {}, options: AepRunnerOptions = {}) {
    this.config = { ...DEFAULT_AEP_CONFIG, ...config };
    this.options = options;
  }

  get isRunning(): boolean {
    return this.running;
  }

  stop(): void {
    this.running = false;
    this.ctx?.close().catch(() => undefined);
    this.ctx = null;
  }

  private playTone(freqHz: number, durationMs: number): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freqHz;
    gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, this.ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + durationMs / 1000);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + durationMs / 1000 + 0.02);
  }

  async run(): Promise<AepStimulus[]> {
    this.ctx = new AudioContext();
    this.stimuli = [];
    this.running = true;
    const { trialCount, standardFreqHz, deviantFreqHz, deviantProbability, minIsiMs, maxIsiMs, toneDurationMs } =
      this.config;

    for (let i = 0; i < trialCount; i++) {
      if (!this.running) break;
      const isi = minIsiMs + Math.random() * (maxIsiMs - minIsiMs);
      await sleep(isi);
      if (!this.running) break;

      const kind: AepStimulus["kind"] = Math.random() < deviantProbability ? "deviant" : "standard";
      const onset = performance.now();
      this.playTone(kind === "deviant" ? deviantFreqHz : standardFreqHz, toneDurationMs);

      const stimulus: AepStimulus = { t: onset, kind, index: i };
      this.stimuli.push(stimulus);
      this.options.onStimulus?.(stimulus);
    }

    this.running = false;
    this.options.onComplete?.(this.stimuli);
    return this.stimuli;
  }
}

/** Slice PPG + motion samples into epochs around each stimulus onset. */
export function buildEpochs(
  stimuli: AepStimulus[],
  ppgEngine: PpgEngine | null,
  motionEngine: MotionEngine | null
): AepEpoch[] {
  return stimuli.map((s) => ({
    stimulusIndex: s.index,
    kind: s.kind,
    onset: s.t,
    ppg: ppgEngine ? ppgEngine.getEpochWindow(s.t, EPOCH_BEFORE_MS, EPOCH_AFTER_MS) : [],
    motion: motionEngine ? motionEngine.getEpochWindow(s.t, EPOCH_BEFORE_MS, EPOCH_AFTER_MS) : [],
  }));
}

function timeGrid(): number[] {
  const grid: number[] = [];
  for (let dt = -EPOCH_BEFORE_MS; dt <= EPOCH_AFTER_MS; dt += EPOCH_BIN_MS) grid.push(dt);
  return grid;
}

/** Bin a single epoch's raw samples onto the shared time grid (nearest-sample
 * within half a bin width), returning null for empty bins. */
export function binEpochToGrid(
  epoch: AepEpoch,
  channel: "ppg" | "motion"
): number[] {
  const samples =
    channel === "ppg" ? epoch.ppg.map((p) => ({ dt: p.dt, value: p.value })) : epoch.motion.map((m) => ({ dt: m.dt, value: m.magnitude }));
  const grid = timeGrid();
  return grid.map((binDt) => {
    let best: { dt: number; value: number } | null = null;
    let bestDist = Infinity;
    for (const s of samples) {
      const dist = Math.abs(s.dt - binDt);
      if (dist < bestDist) {
        bestDist = dist;
        best = s;
      }
    }
    return best && bestDist <= EPOCH_BIN_MS ? best.value : NaN;
  });
}

export interface AveragedTrace {
  dt: number[];
  value: number[];
}

/** Average all epochs of a given condition onto the shared time grid,
 * normalizing each trial (z-score) first so trials with very different
 * absolute PPG/motion baselines still contribute comparably. */
export function averageEpochs(
  epochs: AepEpoch[],
  kind: "standard" | "deviant",
  channel: "ppg" | "motion"
): AveragedTrace {
  const grid = timeGrid();
  const relevant = epochs.filter((e) => e.kind === kind);
  const gridded = relevant.map((e) => binEpochToGrid(e, channel));

  const values = grid.map((_, binIndex) => {
    const vals = gridded.map((g) => g[binIndex]).filter((v) => !Number.isNaN(v));
    if (!vals.length) return NaN;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  });

  return { dt: grid, value: values };
}
