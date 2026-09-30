import type { PillarId } from "../guard/types";
import type { ChannelId, ConsentMap } from "./types";

export const PROBE_CONSENT_KEY = "neuraprobe.consent.v1";
export const PROBE_OVERRIDE_KEY = "neuraprobe.overrides.v1";
export const OVERRIDE_CONFIRM_PHRASE = "OVERRIDE";

export interface ChannelDef {
  id: ChannelId;
  title: string;
  description: string;
  relatedPillar: PillarId;
  supportedNote: string;
}

export const CHANNEL_DEFS: ChannelDef[] = [
  {
    id: "camera",
    title: "Camera (heart rate via PPG)",
    description:
      "Uses your camera to sample light reflected off a fingertip and estimate heart rate and rhythm variability.",
    relatedPillar: "mental-privacy",
    supportedNote: "Requires camera permission. Works in most modern mobile and desktop browsers.",
  },
  {
    id: "motion",
    title: "Motion (scapular/shoulder proxy)",
    description:
      "Uses your device's accelerometer/gyroscope, held or strapped at the upper back, as a tension/asymmetry proxy.",
    relatedPillar: "mental-integrity",
    supportedNote: "iOS requires an explicit motion-permission tap. Not available on desktops without motion sensors.",
  },
  {
    id: "bluetooth",
    title: "Bluetooth heart rate (optional)",
    description: "Connects to a standard Bluetooth Heart Rate Service (0x180D) peripheral, e.g. a chest strap.",
    relatedPillar: "mental-privacy",
    supportedNote: "Web Bluetooth is Chromium-only — unsupported on iOS Safari and Firefox.",
  },
  {
    id: "audio",
    title: "Audio stimuli (for the AEP test)",
    description: "Plays short tones through your speakers/headphones for the oddball evoked-response test. No microphone use.",
    relatedPillar: "cognitive-liberty",
    supportedNote: "Requires audio output only — no microphone permission needed.",
  },
];

export function defaultConsent(): ConsentMap {
  return { camera: false, motion: false, bluetooth: false, audio: false };
}

export function loadConsent(): ConsentMap {
  if (typeof window === "undefined") return defaultConsent();
  try {
    const raw = window.localStorage.getItem(PROBE_CONSENT_KEY);
    if (!raw) return defaultConsent();
    return { ...defaultConsent(), ...JSON.parse(raw) };
  } catch {
    return defaultConsent();
  }
}

export function saveConsent(consent: ConsentMap): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROBE_CONSENT_KEY, JSON.stringify(consent));
}

export function loadOverrides(): ChannelId[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PROBE_OVERRIDE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOverrides(overrides: ChannelId[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROBE_OVERRIDE_KEY, JSON.stringify(overrides));
}

export function clearProbeState(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PROBE_CONSENT_KEY);
  window.localStorage.removeItem(PROBE_OVERRIDE_KEY);
}
