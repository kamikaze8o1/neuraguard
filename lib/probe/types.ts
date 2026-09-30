export type ChannelId = "camera" | "motion" | "bluetooth" | "audio";

export type ConsentMap = Record<ChannelId, boolean>;

export interface PpgSample {
  t: number; // ms, performance.now() timebase
  value: number; // normalized red-channel intensity
}

export interface HrEstimate {
  bpm: number | null;
  rrIntervals: number[]; // ms, most recent first
  rmssd: number | null; // ms
  sdnn: number | null; // ms
  source: "camera" | "bluetooth" | "fused";
  updatedAt: number;
}

export interface MotionSample {
  t: number;
  ax: number;
  ay: number;
  az: number;
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
}

export interface MotionProxy {
  magnitude: number; // instantaneous acceleration magnitude
  tension: number; // rolling variance-based "tension" proxy, 0-100
  asymmetry: number; // rolling left/right (x-axis) asymmetry proxy, -100..100
}

export interface BleHrReading {
  t: number;
  bpm: number;
  rrIntervals?: number[];
}

export type BleSupportState = "unsupported" | "idle" | "connecting" | "connected" | "error";

export interface AepStimulus {
  t: number; // scheduled onset, performance.now() timebase
  kind: "standard" | "deviant";
  index: number;
}

export interface AepEpoch {
  stimulusIndex: number;
  kind: "standard" | "deviant";
  onset: number;
  ppg: Array<{ dt: number; value: number }>;
  motion: Array<{ dt: number; magnitude: number }>;
}

export interface FusionScore {
  overall: number; // 0-100 consistency/evoked-signal-quality proxy
  channels: {
    ppg: number | null;
    motion: number | null;
  };
  trialCount: number;
  notes: string[];
}

export interface ProbeSession {
  schema: "neuraprobe.session.v1";
  startedAt: string;
  endedAt: string;
  consent: ConsentMap;
  overriddenChannels: ChannelId[];
  hr: HrEstimate | null;
  ppgSamples: PpgSample[];
  motionSamples: MotionSample[];
  aepStimuli: AepStimulus[];
  aepEpochs: AepEpoch[];
  fusionScore: FusionScore | null;
}
