// Core domain types for the NeuraGuard side of the app.
// Everything here is pure data — no browser APIs — so it is safe to import
// from both client and server components.

export type PillarId =
  | "mental-privacy"
  | "cognitive-liberty"
  | "mental-integrity"
  | "identity-continuity"
  | "fair-access"
  | "bias-protection";

export type StanceLevel = "protect" | "balanced" | "permit";

export interface PillarRuleDef {
  id: string;
  label: string;
  description: string;
  /** Whether this rule defaults to "on" when stance is protect/balanced/permit. */
  defaultByStance: Record<StanceLevel, boolean>;
}

export interface PillarDef {
  id: PillarId;
  title: string;
  shortTitle: string;
  tagline: string;
  description: string;
  stanceCopy: Record<StanceLevel, string>;
  rules: PillarRuleDef[];
}

export interface CharterPillarState {
  stance: StanceLevel;
  rules: Record<string, boolean>;
  note: string;
}

export interface Charter {
  schema: "neuraguard.charter.v1";
  ownerLabel: string;
  updatedAt: string;
  pillars: Record<PillarId, CharterPillarState>;
}

export type AccessType = "read" | "write" | "stimulate" | "infer";

export type LedgerStatus = "granted" | "denied" | "revoked";

export interface LedgerEntry {
  id: string;
  name: string;
  accessType: AccessType;
  purpose: string;
  status: LedgerStatus;
  timestamp: string;
  notes?: string;
}

export interface Scenario {
  id: string;
  title: string;
  requester: string;
  accessType: AccessType;
  pillarId: PillarId;
  description: string;
  consequences: {
    allow: string;
    allowOnce: string;
    deny: string;
  };
}

export type ScenarioChoice = "allow" | "allow-once" | "deny";

export type RiskLevel = "low" | "medium" | "high";

export interface DecodeTemplate {
  id: string;
  title: string;
  subtitle: string;
  collects: string[];
  infers: string[];
  retention: string;
  secondaryUse: string[];
  userLeverage: string[];
  risk: {
    privacy: RiskLevel;
    agency: RiskLevel;
    integrity: RiskLevel;
  };
}

export interface UploadRecord {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
  extractedText: string;
  caption?: string;
  blob: Blob;
}

export interface UploadDecode extends DecodeTemplate {
  sourceUploadId: string;
}
