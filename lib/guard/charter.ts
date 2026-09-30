import type {
  Charter,
  CharterPillarState,
  PillarDef,
  PillarId,
  StanceLevel,
} from "./types";

export const CHARTER_STORAGE_KEY = "neuraguard.charter.v1";

export const PILLAR_DEFS: PillarDef[] = [
  {
    id: "mental-privacy",
    title: "Mental Privacy",
    shortTitle: "Privacy",
    tagline: "No one reads your mind without a reason you chose.",
    description:
      "Governs who may read raw or inferred neural signals — attention, arousal, emotional state, imagery — and under what purpose.",
    stanceCopy: {
      protect: "Raw neural signal never leaves the device. No passive inference.",
      balanced: "Signals may be processed on-device for the stated purpose only.",
      permit: "Signals may be read and shared for the stated purpose.",
    },
    rules: [
      {
        id: "no-continuous-emotion-inference",
        label: "Block continuous emotion inference",
        description: "Deny apps that continuously score mood, stress, or arousal in the background.",
        defaultByStance: { protect: true, balanced: true, permit: false },
      },
      {
        id: "no-raw-signal-export",
        label: "Block raw signal export",
        description: "Raw waveform data may never leave the device, even encrypted.",
        defaultByStance: { protect: true, balanced: false, permit: false },
      },
      {
        id: "require-purpose-string",
        label: "Require a stated purpose for every read",
        description: "Every read request must show a plain-language purpose before it can be granted.",
        defaultByStance: { protect: true, balanced: true, permit: true },
      },
    ],
  },
  {
    id: "cognitive-liberty",
    title: "Cognitive Liberty",
    shortTitle: "Liberty",
    tagline: "Your attention and thought process are not a product feature.",
    description:
      "Protects your freedom to direct your own attention, thought, and mental effort without covert nudging or manipulation.",
    stanceCopy: {
      protect: "No adaptive nudging based on cognitive state. Ever.",
      balanced: "Nudging allowed only with an explicit, visible prompt each time.",
      permit: "Adaptive nudging allowed to improve the experience.",
    },
    rules: [
      {
        id: "no-covert-nudging",
        label: "Block covert attention nudging",
        description: "No dark-pattern prompts timed to moments of measured distraction or fatigue.",
        defaultByStance: { protect: true, balanced: true, permit: false },
      },
      {
        id: "no-focus-scoring-for-third-parties",
        label: "Block third-party focus scoring",
        description: "Focus / attention scores may not be computed for anyone but you.",
        defaultByStance: { protect: true, balanced: false, permit: false },
      },
    ],
  },
  {
    id: "mental-integrity",
    title: "Mental Integrity",
    shortTitle: "Integrity",
    tagline: "Nothing writes to your mind without explicit, per-session consent.",
    description:
      "Covers any write, stimulate, or neuromodulation access — the highest-stakes permission category.",
    stanceCopy: {
      protect: "All write/stimulate access denied by default, no exceptions.",
      balanced: "Write/stimulate access requires fresh confirmation every session.",
      permit: "Write/stimulate access may be granted persistently for trusted apps.",
    },
    rules: [
      {
        id: "deny-write-by-default",
        label: "Deny write/stimulate access by default",
        description: "Any request to write, stimulate, or neuromodulate starts denied until you act.",
        defaultByStance: { protect: true, balanced: true, permit: false },
      },
      {
        id: "require-per-session-confirmation",
        label: "Require per-session confirmation for stimulation",
        description: "Even previously-granted stimulate access must be re-confirmed each session.",
        defaultByStance: { protect: true, balanced: true, permit: false },
      },
      {
        id: "no-persistent-write-grants",
        label: "Disallow persistent write grants",
        description: "Write access can never be set to \"always allow\" — it expires after one session.",
        defaultByStance: { protect: true, balanced: false, permit: false },
      },
      {
        id: "block-unauthorized-directed-energy",
        label: "Block unauthorized acoustic and RF energy exposure",
        description: "Affirms that your bodily and auditory space cannot be targeted with ultrasonic or pulsed RF fields without consent.",
        defaultByStance: { protect: true, balanced: true, permit: false },
      },
      {
        id: "require-emission-transparency",
        label: "Require emission auditability and shielding rights",
        description: "Upholds the right to monitor ambient acoustic/RF spectrum and deploy architectural or wearable shielding.",
        defaultByStance: { protect: true, balanced: true, permit: true },
      },
    ],
  },
  {
    id: "identity-continuity",
    title: "Personal Identity & Continuity",
    shortTitle: "Identity",
    tagline: "Your sense of self is not a tunable parameter.",
    description:
      "Protects against alteration of memory, personality-adjacent signals, or continuity of self without layered, informed consent.",
    stanceCopy: {
      protect: "No identity-adjacent modulation of any kind.",
      balanced: "Identity-adjacent modulation only in clinical contexts with a named clinician.",
      permit: "Identity-adjacent modulation allowed with informed consent on file.",
    },
    rules: [
      {
        id: "no-identity-modulation",
        label: "Block identity-adjacent modulation",
        description: "No personality, memory, or continuity-relevant stimulation without a clinician of record.",
        defaultByStance: { protect: true, balanced: true, permit: false },
      },
      {
        id: "require-clinician-of-record",
        label: "Require a named clinician of record",
        description: "Clinical-grade write access must be tied to an identifiable, accountable clinician.",
        defaultByStance: { protect: true, balanced: true, permit: true },
      },
    ],
  },
  {
    id: "fair-access",
    title: "Fair Access",
    shortTitle: "Access",
    tagline: "Neurotechnology benefits shouldn't require surrendering your rights.",
    description:
      "Governs whether access to a device, app, or service can be made conditional on surrendering broader neural data rights.",
    stanceCopy: {
      protect: "Service access may never be conditioned on broader data rights.",
      balanced: "Bundling must be disclosed and a no-data-sharing tier must exist.",
      permit: "Bundled terms are acceptable if disclosed upfront.",
    },
    rules: [
      {
        id: "no-access-bundling",
        label: "Block access-for-data bundling",
        description: "\"Use our product\" may not be conditioned on granting unrelated neural data rights.",
        defaultByStance: { protect: true, balanced: true, permit: false },
      },
      {
        id: "require-no-data-tier",
        label: "Require a no-data-sharing tier to exist",
        description: "A version of the service must exist that works without broader data sharing.",
        defaultByStance: { protect: true, balanced: true, permit: false },
      },
    ],
  },
  {
    id: "bias-protection",
    title: "Bias Protection",
    shortTitle: "Bias",
    tagline: "Inferences about you should not encode someone else's bias.",
    description:
      "Covers protection against discriminatory or unvalidated inference — especially in employment, insurance, or law-enforcement contexts.",
    stanceCopy: {
      protect: "No inference may be used in employment, insurance, or legal contexts, period.",
      balanced: "Such inference requires independent validation and an appeal path.",
      permit: "Such inference is allowed if disclosed and consented to per use.",
    },
    rules: [
      {
        id: "no-employment-inference",
        label: "Block employment/insurance/legal use of inference",
        description: "Neural inferences may never feed employment, insurance, or legal decisions.",
        defaultByStance: { protect: true, balanced: true, permit: false },
      },
      {
        id: "require-validation-and-appeal",
        label: "Require validation + appeal path for high-stakes inference",
        description: "Any high-stakes inference must be independently validated and appealable.",
        defaultByStance: { protect: true, balanced: true, permit: true },
      },
    ],
  },
];

export const PILLAR_ORDER: PillarId[] = PILLAR_DEFS.map((p) => p.id);

export function pillarDef(id: PillarId): PillarDef {
  const def = PILLAR_DEFS.find((p) => p.id === id);
  if (!def) throw new Error(`Unknown pillar id: ${id}`);
  return def;
}

function buildPillarState(def: PillarDef, stance: StanceLevel): CharterPillarState {
  const rules: Record<string, boolean> = {};
  for (const rule of def.rules) {
    rules[rule.id] = rule.defaultByStance[stance];
  }
  return { stance, rules, note: "" };
}

export function defaultCharter(): Charter {
  const pillars = {} as Charter["pillars"];
  for (const def of PILLAR_DEFS) {
    pillars[def.id] = buildPillarState(def, "protect");
  }
  return {
    schema: "neuraguard.charter.v1",
    ownerLabel: "My Neuro Charter",
    updatedAt: new Date().toISOString(),
    pillars,
  };
}

export function setPillarStance(charter: Charter, pillarId: PillarId, stance: StanceLevel): Charter {
  const def = pillarDef(pillarId);
  const next = { ...charter, pillars: { ...charter.pillars } };
  next.pillars[pillarId] = buildPillarState(def, stance);
  next.updatedAt = new Date().toISOString();
  return next;
}

export function setPillarRule(
  charter: Charter,
  pillarId: PillarId,
  ruleId: string,
  enabled: boolean
): Charter {
  const next = { ...charter, pillars: { ...charter.pillars } };
  const current = next.pillars[pillarId];
  next.pillars[pillarId] = {
    ...current,
    rules: { ...current.rules, [ruleId]: enabled },
  };
  next.updatedAt = new Date().toISOString();
  return next;
}

export function setPillarNote(charter: Charter, pillarId: PillarId, note: string): Charter {
  const next = { ...charter, pillars: { ...charter.pillars } };
  next.pillars[pillarId] = { ...next.pillars[pillarId], note };
  next.updatedAt = new Date().toISOString();
  return next;
}

export function setOwnerLabel(charter: Charter, label: string): Charter {
  return { ...charter, ownerLabel: label, updatedAt: new Date().toISOString() };
}

export function loadCharter(): Charter {
  if (typeof window === "undefined") return defaultCharter();
  try {
    const raw = window.localStorage.getItem(CHARTER_STORAGE_KEY);
    if (!raw) return defaultCharter();
    const parsed = JSON.parse(raw) as Charter;
    if (parsed.schema !== "neuraguard.charter.v1") return defaultCharter();
    return parsed;
  } catch {
    return defaultCharter();
  }
}

export function saveCharter(charter: Charter): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CHARTER_STORAGE_KEY, JSON.stringify(charter));
}

export function hasStoredCharter(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(CHARTER_STORAGE_KEY) !== null;
}

export function clearCharter(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CHARTER_STORAGE_KEY);
}

/** Machine-readable ruleset: a flattened, stable JSON shape meant for other
 * tools/devices to consume — distinct from the raw Charter storage shape. */
export interface CharterRuleset {
  schema: "neuraguard.ruleset.v1";
  generatedAt: string;
  ownerLabel: string;
  pillars: Array<{
    id: PillarId;
    title: string;
    stance: StanceLevel;
    note: string;
    rules: Array<{ id: string; label: string; enabled: boolean }>;
  }>;
}

export function toRuleset(charter: Charter): CharterRuleset {
  return {
    schema: "neuraguard.ruleset.v1",
    generatedAt: charter.updatedAt,
    ownerLabel: charter.ownerLabel,
    pillars: PILLAR_DEFS.map((def) => {
      const state = charter.pillars[def.id];
      return {
        id: def.id,
        title: def.title,
        stance: state.stance,
        note: state.note,
        rules: def.rules.map((rule) => ({
          id: rule.id,
          label: rule.label,
          enabled: state.rules[rule.id] ?? false,
        })),
      };
    }),
  };
}

/** True if the charter denies read/infer access for a given pillar — used by
 * NeuraProbe's consent gate to decide whether to block a sensor channel. */
export function pillarDeniesReadOrInfer(charter: Charter, pillarId: PillarId): boolean {
  const state = charter.pillars[pillarId];
  if (!state) return false;
  if (state.stance === "protect") return true;
  if (pillarId === "mental-privacy" && state.rules["no-continuous-emotion-inference"]) return true;
  if (pillarId === "cognitive-liberty" && state.rules["no-focus-scoring-for-third-parties"]) return true;
  return false;
}
