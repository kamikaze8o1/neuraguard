import type { DecodeTemplate, RiskLevel } from "./types";

export const DECODE_TEMPLATES: DecodeTemplate[] = [
  {
    id: "consumer-headset",
    title: "Consumer meditation headset",
    subtitle: "Typical consumer wellness EEG/PPG headband terms",
    collects: [
      "Raw or lightly filtered EEG-band signal during sessions",
      "Heart rate and heart-rate variability",
      "Session duration, time of day, device motion",
      "Account email and device identifiers",
    ],
    infers: [
      "\"Calm\" / \"focus\" / \"stress\" scores per session",
      "Long-term relaxation trend used for streaks and gamification",
      "Approximate sleep-adjacent wind-down patterns",
    ],
    retention: "Retained indefinitely unless you manually request deletion; backups may persist 90 days after deletion.",
    secondaryUse: [
      "Aggregated, de-identified trends shared with a research partner",
      "Used to personalize in-app upsell offers",
      "May be disclosed to acquirer in the event of a company sale",
    ],
    userLeverage: [
      "Data export available on request",
      "Deletion request via support email, not self-serve",
      "No opt-out from de-identified aggregate sharing",
    ],
    risk: { privacy: "medium", agency: "medium", integrity: "low" },
  },
  {
    id: "clinical-bci",
    title: "Clinical BCI (movement / neuromodulation)",
    subtitle: "Typical clinical brain-computer interface consent form",
    collects: [
      "Implanted or scalp electrode signal, clinical-grade sampling rate",
      "Stimulation parameters and adjustment history",
      "Linked medical record data (diagnosis, medications)",
    ],
    infers: [
      "Symptom severity trends (e.g. tremor frequency/amplitude)",
      "Device/battery telemetry correlated with usage patterns",
    ],
    retention: "Retained per medical records law (often 7+ years); tied to your clinical record, not self-deletable.",
    secondaryUse: [
      "De-identified data may be used in device-maker's regulatory/research filings",
      "Aggregate outcomes may be shared with your care team's health system",
    ],
    userLeverage: [
      "Right to access your record via HIPAA-equivalent request",
      "Right to a named clinician of record accountable for write access",
      "No self-serve deletion — tied to medical record retention rules",
    ],
    risk: { privacy: "medium", agency: "low", integrity: "high" },
  },
  {
    id: "workplace-wellness-band",
    title: "Workplace wellness band",
    subtitle: "Typical employer-provided productivity/wellness wearable terms",
    collects: [
      "Continuous heart rate, motion, and posture proxies",
      "Self-reported mood/stress check-ins",
      "Location within office/campus (via badge integration)",
    ],
    infers: [
      "Daily \"focus\" or \"engagement\" scores visible to a dashboard",
      "Fatigue/burnout risk flags surfaced to HR analytics",
      "Team-level aggregate comparisons",
    ],
    retention: "Retained for duration of employment plus a rolling 2-year analytics window.",
    secondaryUse: [
      "Aggregated scores may inform team staffing or scheduling decisions",
      "Vendor may use de-identified data to benchmark across client companies",
    ],
    userLeverage: [
      "Opt-out often technically available but socially discouraged",
      "No independent appeal process for a flagged \"risk\" score",
      "Data typically not user-exportable — it belongs to the employer contract",
    ],
    risk: { privacy: "high", agency: "high", integrity: "medium" },
  },
];

const RISK_KEYWORDS: Record<RiskLevel, string[]> = {
  high: [
    "sell",
    "third party",
    "third-party",
    "indefinitely",
    "employer",
    "insurer",
    "insurance",
    "law enforcement",
    "biometric",
    "advertising partner",
    "no opt-out",
    "irrevocable",
    "perpetual",
    "sublicense",
  ],
  medium: [
    "aggregate",
    "de-identified",
    "deidentified",
    "anonymized",
    "research partner",
    "analytics",
    "retain",
    "retention",
    "acquirer",
    "affiliate",
  ],
  low: ["opt out", "opt-out", "delete", "deletion", "export", "consent", "revoke", "encrypted", "on-device"],
};

function scoreCategory(text: string, extraHighTerms: string[] = []): RiskLevel {
  const lower = text.toLowerCase();
  let highHits = extraHighTerms.filter((t) => lower.includes(t)).length;
  let mediumHits = 0;
  let lowHits = 0;
  for (const kw of RISK_KEYWORDS.high) if (lower.includes(kw)) highHits++;
  for (const kw of RISK_KEYWORDS.medium) if (lower.includes(kw)) mediumHits++;
  for (const kw of RISK_KEYWORDS.low) if (lower.includes(kw)) lowHits++;

  const score = highHits * 3 + mediumHits * 1 - lowHits * 1.5;
  if (score >= 6) return "high";
  if (score >= 2) return "medium";
  return "low";
}

function extractList(text: string, terms: string[], max = 6): string[] {
  const lower = text.toLowerCase();
  const hits = terms.filter((t) => lower.includes(t));
  return hits.slice(0, max).map((h) => h[0].toUpperCase() + h.slice(1));
}

const COLLECT_TERMS = [
  "eeg",
  "heart rate",
  "motion",
  "location",
  "gps",
  "email",
  "device identifier",
  "biometric",
  "audio",
  "video",
  "camera",
  "voice",
];

const INFER_TERMS = [
  "stress",
  "focus",
  "attention",
  "mood",
  "emotion",
  "fatigue",
  "engagement",
  "risk score",
  "sleep",
  "personality",
];

const SECONDARY_TERMS = [
  "advertis",
  "third party",
  "third-party",
  "research partner",
  "affiliate",
  "acquirer",
  "law enforcement",
  "insurer",
  "employer",
  "marketing",
];

const LEVERAGE_TERMS = ["opt out", "opt-out", "delete", "export", "revoke", "appeal", "consent withdrawal"];

export function heuristicDecodeFromText(text: string, sourceLabel: string): DecodeTemplate {
  const collects = extractList(text, COLLECT_TERMS);
  const infers = extractList(text, INFER_TERMS);
  const secondaryUse = extractList(text, SECONDARY_TERMS);
  const userLeverage = extractList(text, LEVERAGE_TERMS);

  const privacy = scoreCategory(text, ["biometric", "third party", "third-party", "sell"]);
  const agency = scoreCategory(text, ["no opt-out", "irrevocable", "perpetual", "employer"]);
  const integrity = scoreCategory(text, ["stimulat", "neuromodulat", "implant", "write access"]);

  const retentionMatch = text.match(/retain[a-z]*[^.]{0,140}\./i) ?? text.match(/period of [^.]{0,80}\./i);

  return {
    id: `upload-decode`,
    title: sourceLabel,
    subtitle: "Heuristic decode from your uploaded document",
    collects: collects.length ? collects : ["No specific data types detected — review the source document manually."],
    infers: infers.length ? infers : ["No specific inferences detected — review the source document manually."],
    retention: retentionMatch ? retentionMatch[0].trim() : "No explicit retention period detected in the text.",
    secondaryUse: secondaryUse.length ? secondaryUse : ["No secondary-use language detected."],
    userLeverage: userLeverage.length ? userLeverage : ["No user-leverage / opt-out language detected."],
    risk: { privacy, agency, integrity },
  };
}

export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};
