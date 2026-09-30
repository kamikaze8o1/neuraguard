import type { AcousticMetrics } from "./acoustic";
import type { HrEstimate, MotionProxy } from "./types";

export type IncidentSeverity = "normal" | "warning" | "anomaly" | "critical";

export interface IncidentRecord {
  id: string;
  timestamp: string;
  severity: IncidentSeverity;
  triggerReason: string;
  notes?: string;
  acoustic: {
    peakFrequency: number;
    peakDb: number;
    overallRmsDb: number;
    ultrasonicPeakFreq: number;
    ultrasonicPeakDb: number;
    isCarrierDetected: boolean;
    crestFactor: number;
    isHarmonicTrain: boolean;
    estimatedPrfHz: number | null;
    topPeaks: Array<{ freq: number; db: number }>;
  } | null;
  motion: {
    magnitude: number;
    tension: number;
    asymmetry: number;
  } | null;
  physio: {
    bpm: number | null;
    rmssd: number | null;
    source: string | null;
  } | null;
  checksum: string;
}

export const INCIDENT_STORAGE_KEY = "neuraprobe.incidents.v1";

// Fast non-cryptographic checksum for tamper-evidence
function computeChecksum(data: Record<string, unknown>): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return "chk-" + Math.abs(hash).toString(16).padStart(8, "0");
}

export function createIncidentRecord(input: {
  severity: IncidentSeverity;
  triggerReason: string;
  notes?: string;
  acousticMetrics?: AcousticMetrics | null;
  motionProxy?: MotionProxy | null;
  hrEstimate?: HrEstimate | null;
}): IncidentRecord {
  const id = `inc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const timestamp = new Date().toISOString();

  const acoustic = input.acousticMetrics
    ? {
        peakFrequency: input.acousticMetrics.peakFrequency,
        peakDb: input.acousticMetrics.peakDb,
        overallRmsDb: input.acousticMetrics.overallRmsDb,
        ultrasonicPeakFreq: input.acousticMetrics.ultrasonic.peakFrequency,
        ultrasonicPeakDb: input.acousticMetrics.ultrasonic.peakDb,
        isCarrierDetected: input.acousticMetrics.ultrasonic.isCarrierDetected,
        crestFactor: input.acousticMetrics.rectification.crestFactor,
        isHarmonicTrain: input.acousticMetrics.rectification.isHarmonicTrainDetected,
        estimatedPrfHz: input.acousticMetrics.rectification.estimatedPrfHz,
        topPeaks: input.acousticMetrics.topPeaks,
      }
    : null;

  const motion = input.motionProxy
    ? {
        magnitude: input.motionProxy.magnitude,
        tension: input.motionProxy.tension,
        asymmetry: input.motionProxy.asymmetry,
      }
    : null;

  const physio = input.hrEstimate
    ? {
        bpm: input.hrEstimate.bpm,
        rmssd: input.hrEstimate.rmssd,
        source: input.hrEstimate.source,
      }
    : null;

  const payloadToHash = { id, timestamp, severity: input.severity, triggerReason: input.triggerReason, acoustic, motion, physio };
  const checksum = computeChecksum(payloadToHash);

  return {
    id,
    timestamp,
    severity: input.severity,
    triggerReason: input.triggerReason,
    notes: input.notes,
    acoustic,
    motion,
    physio,
    checksum,
  };
}

export function loadIncidents(): IncidentRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(INCIDENT_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveIncident(record: IncidentRecord): void {
  if (typeof window === "undefined") return;
  const existing = loadIncidents();
  const updated = [record, ...existing.slice(0, 49)]; // keep latest 50
  window.localStorage.setItem(INCIDENT_STORAGE_KEY, JSON.stringify(updated));
}

export function deleteIncident(id: string): void {
  if (typeof window === "undefined") return;
  const existing = loadIncidents();
  const updated = existing.filter((r) => r.id !== id);
  window.localStorage.setItem(INCIDENT_STORAGE_KEY, JSON.stringify(updated));
}

export function clearIncidents(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(INCIDENT_STORAGE_KEY);
}

export function exportIncidentsJson(incidents: IncidentRecord[]): void {
  const dossier = {
    schema: "neuraprobe.incident-dossier.v1",
    generatedAt: new Date().toISOString(),
    recordCount: incidents.length,
    incidents,
  };
  const json = JSON.stringify(dossier, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ahi-incident-dossier-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
