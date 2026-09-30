// Combines per-channel AEP epochs into a "fusion evoked score" and builds
// the exportable session object. The score is a consistency proxy (how
// similarly-shaped each trial's response is to the average response) — it
// is explicitly NOT a clinical evoked-potential amplitude/latency measure.
import { binEpochToGrid } from "./aep";
import type { AepEpoch, AepStimulus, ConsentMap, FusionScore, HrEstimate, MotionSample, PpgSample, ProbeSession, ChannelId } from "./types";

function pearsonCorrelation(a: number[], b: number[]): number | null {
  const pairs = a.map((v, i) => [v, b[i]]).filter(([x, y]) => !Number.isNaN(x) && !Number.isNaN(y));
  if (pairs.length < 4) return null;
  const n = pairs.length;
  const meanA = pairs.reduce((s, [x]) => s + x, 0) / n;
  const meanB = pairs.reduce((s, [, y]) => s + y, 0) / n;
  let num = 0;
  let denA = 0;
  let denB = 0;
  for (const [x, y] of pairs) {
    num += (x - meanA) * (y - meanB);
    denA += (x - meanA) ** 2;
    denB += (y - meanB) ** 2;
  }
  const den = Math.sqrt(denA * denB);
  if (den === 0) return null;
  return num / den;
}

function channelConsistency(epochs: AepEpoch[], channel: "ppg" | "motion"): number | null {
  const relevant = epochs.filter((e) => (channel === "ppg" ? e.ppg.length > 0 : e.motion.length > 0));
  if (relevant.length < 4) return null;

  const gridded = relevant.map((e) => binEpochToGrid(e, channel));
  const gridLength = gridded[0]?.length ?? 0;
  if (!gridLength) return null;

  const mean = Array.from({ length: gridLength }, (_, i) => {
    const vals = gridded.map((g) => g[i]).filter((v) => !Number.isNaN(v));
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : NaN;
  });

  const correlations = gridded
    .map((trial) => pearsonCorrelation(trial, mean))
    .filter((c): c is number => c !== null);

  if (!correlations.length) return null;
  const avg = correlations.reduce((a, b) => a + b, 0) / correlations.length;
  return Math.round(Math.max(0, Math.min(1, avg)) * 100);
}

export function computeFusionScore(epochs: AepEpoch[]): FusionScore {
  const notes: string[] = [];
  const ppg = channelConsistency(epochs, "ppg");
  const motion = channelConsistency(epochs, "motion");
  const available = [ppg, motion].filter((v): v is number => v !== null);
  const overall = available.length ? Math.round(available.reduce((a, b) => a + b, 0) / available.length) : 0;

  if (epochs.length < 8) notes.push("Fewer than 8 trials captured — treat this score as low-confidence.");
  if (ppg === null) notes.push("No PPG channel data available for fusion (camera sensor not active during the run).");
  if (motion === null) notes.push("No motion channel data available for fusion (motion sensor not active during the run).");
  if (!available.length) notes.push("No channels produced usable data — this score is not meaningful.");

  return { overall, channels: { ppg, motion }, trialCount: epochs.length, notes };
}

export interface BuildSessionInput {
  startedAt: string;
  consent: ConsentMap;
  overriddenChannels: ChannelId[];
  hr: HrEstimate | null;
  ppgSamples: PpgSample[];
  motionSamples: MotionSample[];
  aepStimuli: AepStimulus[];
  aepEpochs: AepEpoch[];
}

export function buildSession(input: BuildSessionInput): ProbeSession {
  return {
    schema: "neuraprobe.session.v1",
    startedAt: input.startedAt,
    endedAt: new Date().toISOString(),
    consent: input.consent,
    overriddenChannels: input.overriddenChannels,
    hr: input.hr,
    ppgSamples: input.ppgSamples,
    motionSamples: input.motionSamples,
    aepStimuli: input.aepStimuli,
    aepEpochs: input.aepEpochs,
    fusionScore: input.aepEpochs.length ? computeFusionScore(input.aepEpochs) : null,
  };
}

export function downloadSession(session: ProbeSession): void {
  const json = JSON.stringify(session, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `neuraprobe-session-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
