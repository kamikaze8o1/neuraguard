import type { Scenario } from "./types";

export const SCENARIOS: Scenario[] = [
  {
    id: "continuous-emotion-inference",
    title: "Continuous emotion inference",
    requester: "Mood-tracking wellness app",
    accessType: "infer",
    pillarId: "mental-privacy",
    description:
      "The app wants to continuously infer your emotional state in the background so it can \"proactively\" suggest breathing exercises.",
    consequences: {
      allow:
        "The app builds a 24/7 emotional profile of you, stored on its servers, and may use it to personalize ads or sell aggregate mood trends to advertisers.",
      allowOnce:
        "The app gets a single emotional snapshot for this session only. It cannot build a long-term profile from this alone.",
      deny: "The app falls back to manual mood check-ins you type in yourself. No passive inference occurs.",
    },
  },
  {
    id: "clinic-write-tremor",
    title: "Clinical write access for tremor suppression",
    requester: "Movement disorder clinic",
    accessType: "write",
    pillarId: "mental-integrity",
    description:
      "Your neurologist's clinic requests ongoing write access to deliver closed-loop stimulation that suppresses hand tremor.",
    consequences: {
      allow:
        "The clinic can adjust stimulation parameters remotely between visits, which speeds up care but means write access persists between sessions.",
      allowOnce:
        "Stimulation parameters are locked after this visit. Any future adjustment requires you to be physically present and re-authorize.",
      deny: "No stimulation adjustment occurs. You'd need an in-person, cable-tethered session instead.",
    },
  },
  {
    id: "employer-focus-scoring",
    title: "Employer focus scoring",
    requester: "Employer-provided productivity headband",
    accessType: "infer",
    pillarId: "cognitive-liberty",
    description:
      "Your employer's IT department wants your work-issued headband to compute a daily \"focus score\" visible to your manager.",
    consequences: {
      allow:
        "Your manager sees a daily focus score. This can influence performance reviews even though attention naturally fluctuates for non-work reasons.",
      allowOnce:
        "A focus score is computed for today only as a demo; it is not shared with your manager or stored beyond today.",
      deny: "No focus score is computed. The headband continues to function for its stated ergonomic purpose only.",
    },
  },
  {
    id: "insurer-risk-inference",
    title: "Insurer risk inference",
    requester: "Health insurance wellness partner",
    accessType: "infer",
    pillarId: "bias-protection",
    description:
      "A wellness partner linked to your health insurer wants to infer stress and cognitive-decline risk from your consumer headset data to adjust premiums.",
    consequences: {
      allow:
        "Inferred risk scores may be used to adjust your premium or coverage, based on an unvalidated consumer-grade model with no appeal process.",
      allowOnce:
        "A one-time, informational risk score is shown to you only. It is not transmitted to the insurer.",
      deny: "No risk inference is computed or shared. Your premium is unaffected by neural data.",
    },
  },
  {
    id: "app-identity-personalization",
    title: "\"Personality-adaptive\" content feed",
    requester: "Social content app",
    accessType: "infer",
    pillarId: "identity-continuity",
    description:
      "An app wants to infer identity-adjacent traits (values, in-group affiliation, susceptibility to persuasion) to hyper-personalize your feed.",
    consequences: {
      allow:
        "Your feed becomes a closed loop optimized to reinforce your inferred traits and susceptibility, subtly narrowing what you see over time.",
      allowOnce:
        "A single, disclosed personalization pass runs for this session and is discarded afterward.",
      deny: "The feed uses only your explicit follows and searches — no inferred identity traits.",
    },
  },
  {
    id: "research-institute-aggregate",
    title: "Anonymized research aggregation",
    requester: "University neuroscience lab",
    accessType: "read",
    pillarId: "fair-access",
    description:
      "A university lab wants to read anonymized, aggregated attention data from your device to study public attention trends — no individual profile is built.",
    consequences: {
      allow:
        "Your anonymized data contributes to open research. Access to the base product remains free either way, so this doesn't bundle access with data rights.",
      allowOnce:
        "A single anonymized data point is contributed for the current session only.",
      deny: "No data is shared with the lab. Your access to the product is unaffected, since access was never conditioned on this.",
    },
  },
];
