export type PatentCategory =
  | "microwave-auditory"
  | "ultrasonic-parametric"
  | "directed-energy"
  | "dosimetry-sensor";

export type PlausibilityTier =
  | "proven-physics"       // Verified by published biophysics (NASEM, IEEE, peer-reviewed)
  | "engineering-prototype" // Demonstrated hardware / functional military or commercial prototype
  | "speculative-concept";   // Paper patent / theoretical concept without field verification

export interface PatentEntry {
  id: string;
  patentNumber: string;
  title: string;
  assignee: string;
  inventors: string[];
  issueDate: string;
  category: PatentCategory;
  plausibility: PlausibilityTier;
  frequencyBand: string;
  claimedMechanism: string;
  physicalPrinciples: string;
  havanaSyndromeRelevance: string;
  countermeasures: string[];
  citations: string[];
  url?: string;
}

export const PATENT_DATABASE: PatentEntry[] = [
  {
    id: "us-4877027",
    patentNumber: "US 4,877,027",
    title: "Hearing System",
    assignee: "Independent / Wayne B. Brunkan",
    inventors: ["Wayne B. Brunkan"],
    issueDate: "1989-10-31",
    category: "microwave-auditory",
    plausibility: "proven-physics",
    frequencyBand: "100 MHz – 10,000 MHz (10 GHz)",
    claimedMechanism:
      "Direct induction of sound in the head of a human by irradiating microwave bursts modulated with an audio signal. Pulses cause thermoelastic expansion waves in cranial fluids and tissues that stimulate the cochlea directly.",
    physicalPrinciples:
      "Thermoelastic expansion: Very short (<10 µs) high-peak RF pulses produce microscopic thermal rises (ΔT ≈ 10⁻⁶ °C) in brain tissue, creating acoustic pressure gradients that propagate via bone and tissue conduction directly to the cochlea, exciting hair cells.",
    havanaSyndromeRelevance:
      "Directly validates reports from Havana diplomats who heard localized clicking, chirping, or buzzing that could not be blocked by covering their ears. In MAE, the acoustic wave originates inside the skull.",
    countermeasures: [
      "Faraday cage / Copper-mesh window shielding (attenuates RF by >40 dB)",
      "Continuous RF pulse envelope monitors (diode detectors)",
      "High-density conductive window film (silver/indium tin oxide)",
    ],
    citations: [
      "Frey, A. H. (1961). Auditory system response to radio frequency energy. Aerospace Medicine, 32, 1140-1142.",
      "Lin, J. C. (1978). Auditory Effects of Microwave Radiation. Springer-Verlag.",
    ],
    url: "https://patents.google.com/patent/US4877027A/en",
  },
  {
    id: "us-6587729",
    patentNumber: "US 6,587,729 B2",
    title: "Apparatus for Audibly Communicating Speech Using the Radio Frequency Hearing Effect",
    assignee: "United States of America as represented by the Secretary of the Air Force (USAF)",
    inventors: ["Daniel F. O'Loughlin", "Diana L. Loree"],
    issueDate: "2003-07-01",
    category: "microwave-auditory",
    plausibility: "engineering-prototype",
    frequencyBand: "1 GHz – 3 GHz (typical pulsed microwave radar bands)",
    claimedMechanism:
      "Encodes voice messages onto pulsed microwave beams by converting input audio speech into bursts of RF pulses. When the pulses strike head tissues, thermoelastic acoustic expansion reconstructs intelligible sound inside the auditory system.",
    physicalPrinciples:
      "Pulse-position and pulse-interval modulation: By modulating the timing between microsecond bursts, acoustic pressure waveforms mimicking spoken syllables are induced inside the cranial vault at sound pressure levels above auditory thresholds.",
    havanaSyndromeRelevance:
      "Official US Air Force patent demonstrating government laboratory R&D into weaponized or communications-grade microwave auditory effect technologies. Rebuts skepticism that military institutions have researched MAE.",
    countermeasures: [
      "Architectural RF shielding (conductive wall paints, silver-lined curtains)",
      "RF spectrum analyzers calibrated for microsecond pulse detection",
      "Shielded secure rooms (SCIF standard TEMPEST shielding)",
    ],
    citations: [
      "USAF Research Laboratory Directed Energy Directorate technical reports",
      "Lin, J. C. (2021). Weaponizing the microwave auditory effect. URSI Radio Science Bulletin.",
    ],
    url: "https://patents.google.com/patent/US6587729B2/en",
  },
  {
    id: "us-6470214",
    patentNumber: "US 6,470,214 B1",
    title: "Method and Device for Generating Radio Frequency Acoustic Signals",
    assignee: "United States of America as represented by the Secretary of the Air Force (USAF)",
    inventors: ["James A. Cook"],
    issueDate: "2002-10-22",
    category: "microwave-auditory",
    plausibility: "engineering-prototype",
    frequencyBand: "UHF / Microwave bands",
    claimedMechanism:
      "Synthesizes acoustic shockwaves and acoustic pressure pulses at biological interfaces by tuning the radio frequency pulse shape and repetition rate to match acoustic natural resonances of target tissues.",
    physicalPrinciples:
      "Resonant thermo-acoustic impedance matching: Induces shockwaves at dielectric boundary layers (such as the interface between the skull bone, dura mater, and cerebrospinal fluid).",
    havanaSyndromeRelevance:
      "Explains why Havana victims reported intense localized cranial pressure ('a wall of air' or 'a punch in the head') and subsequent vestibular/cochlear barotrauma even when sound perception was faint.",
    countermeasures: [
      "Multi-layer RF reflective barriers",
      "Piezoelectric acoustic pulse loggers",
      "Electromagnetic shielding of residential quarters",
    ],
    citations: [
      "National Academies of Sciences (2020). Consensus Study Report on Anomalous Health Incidents.",
    ],
    url: "https://patents.google.com/patent/US6470214B1/en",
  },
  {
    id: "us-4858612",
    patentNumber: "US 4,858,612",
    title: "Hearing Device",
    assignee: "Independent / Philip L. Stocklin",
    inventors: ["Philip L. Stocklin"],
    issueDate: "1989-08-22",
    category: "microwave-auditory",
    plausibility: "proven-physics",
    frequencyBand: "2.4 GHz – 10 GHz",
    claimedMechanism:
      "A method of using microwaves to stimulate auditory sensations by directing modulated microwave pulses to the cochlear region, converting audio intelligence directly into neural firing rates.",
    physicalPrinciples:
      "Electromagnetic coupling into cochlear microphonics: High dielectric absorption by perilymph and endolymph fluids in the inner ear produces direct acoustic vibrations.",
    havanaSyndromeRelevance:
      "Highlights how the inner ear's fluid chambers (cochlea and vestibular labyrinth) act as focal points for thermoelastic energy absorption, directly explaining acute vertigo and tinnitus.",
    countermeasures: [
      "Wearable RF dosimeters",
      "RF-attenuating headgear / hoods (metalized microfiber fabrics)",
    ],
    citations: ["Chou, C. K., & Guy, A. W. (1977). Microwave-induced auditory responses. IEEE Transactions."],
    url: "https://patents.google.com/patent/US4858612A/en",
  },
  {
    id: "us-5889870",
    patentNumber: "US 5,889,870",
    title: "Acoustic Heterodyne Device and Method",
    assignee: "American Technology Corporation (ATC)",
    inventors: ["Elwood G. Norris"],
    issueDate: "1999-03-30",
    category: "ultrasonic-parametric",
    plausibility: "proven-physics",
    frequencyBand: "30 kHz – 200 kHz (Ultrasonic acoustic)",
    claimedMechanism:
      "Emits an intense, collimated ultrasonic carrier wave modulated by audio signals. Because air compresses non-linearly under high acoustic pressure, the carrier wave self-demodulates along the beam path, creating an audible sound beam heard only in line-of-sight.",
    physicalPrinciples:
      "Non-linear parametric array: The virtual acoustic source is created along the air column. Outside the narrow beam, the sound is virtually inaudible. Foundation of commercial Hypersonic Sound (HSS) and Long Range Acoustic Device (LRAD) systems.",
    havanaSyndromeRelevance:
      "Directly explains the extreme spatial confinement reported by Havana victims—where a person standing in a doorway felt severe symptoms while someone standing two feet to the side heard and felt nothing.",
    countermeasures: [
      "Acoustic damping barriers and mass-loaded vinyl curtains",
      "Ultrasonic microphone monitors (18 kHz – 40 kHz detectors)",
      "Ear protection (conventional earplugs DO attenuate airborne ultrasound)",
    ],
    citations: [
      "Westervelt, P. J. (1963). Parametric acoustic array. Journal of the Acoustical Society of America.",
    ],
    url: "https://patents.google.com/patent/US5889870A/en",
  },
  {
    id: "us-6011855",
    patentNumber: "US 6,011,855",
    title: "Device for Generating Directional Audio Sound from Ultrasonic Wave",
    assignee: "Independent / Sheng-Heh Terry Hsu",
    inventors: ["Sheng-Heh Terry Hsu"],
    issueDate: "2000-01-04",
    category: "ultrasonic-parametric",
    plausibility: "proven-physics",
    frequencyBand: "40 kHz – 100 kHz",
    claimedMechanism:
      "Uses a phased array of piezoelectric ultrasonic transducers to generate highly directional audio sound through parametric demodulation, allowing tight beam steering and localized acoustic projection.",
    physicalPrinciples:
      "Non-linear acoustic intermodulation: High sound pressure levels (>130 dB SPL at ultrasound) force air molecules into non-linear harmonic distortion, producing audible difference frequencies.",
    havanaSyndromeRelevance:
      "Demonstrates how directional ultrasonic beams can target an individual's bedroom or desk from across a street or through open windows.",
    countermeasures: [
      "Dual-pane acoustic laminated windows",
      "High-frequency microphone continuous logging",
      "Ultrasonic spectrum monitoring",
    ],
    citations: [
      "Fu, K. et al. (2018). On Havana Syndrome: Acoustic Intermodulation of Ultrasonic Signals. Univ. of Michigan.",
    ],
    url: "https://patents.google.com/patent/US6011855A/en",
  },
  {
    id: "us-5159703",
    patentNumber: "US 5,159,703",
    title: "Silent Subliminal Presentation System",
    assignee: "Independent / Oliver M. Lowery",
    inventors: ["Oliver M. Lowery"],
    issueDate: "1992-10-27",
    category: "ultrasonic-parametric",
    plausibility: "engineering-prototype",
    frequencyBand: "14.5 kHz – 20 kHz (Very High Audio / Near-Ultrasound)",
    claimedMechanism:
      "Generates acoustic signals in the very high frequency audio band (14.5 kHz to 20 kHz) modulated with voice or tones. The signal is near or above typical adult hearing thresholds, inducing subconscious psychological and sensory effects.",
    physicalPrinciples:
      "High-frequency acoustic stimulation: High-amplitude tones near the upper hearing limit cause acute cochlear stress, nausea, and headache without the victim consciously recognizing intelligible speech.",
    havanaSyndromeRelevance:
      "Explains why younger embassy staff or children often reported piercing sounds while older personnel only reported acute pressure, nausea, and ear pain.",
    countermeasures: [
      "Browser/phone microphone high-frequency spectrum analyzer (monitoring 15–20 kHz)",
      "Commercial audio notch filters",
    ],
    citations: ["Lowery, O. M. (1992). Silent Subliminal Presentation. US Patent."],
    url: "https://patents.google.com/patent/US5159703A/en",
  },
  {
    id: "us-7629918",
    patentNumber: "US 7,629,918 B2",
    title: "Multifunctional Directed Energy System",
    assignee: "Raytheon Company",
    inventors: ["Mark S. Henderson", "Ronald E. Flamm", "et al."],
    issueDate: "2009-12-08",
    category: "directed-energy",
    plausibility: "proven-physics",
    frequencyBand: "95 GHz (Millimeter Wave) & High-Power Microwave (HPM)",
    claimedMechanism:
      "A dual-band directed energy system integrating high-power microwaves for electronic defeat with millimeter-wave energy for non-lethal personnel deterrence (Active Denial System / ADS).",
    physicalPrinciples:
      "Cutaneous thermal stimulation and RF induction: At 95 GHz, energy penetrates ~1/64th of an inch into skin, heating water molecules rapidly and stimulating pain nociceptors without burning deeper tissue.",
    havanaSyndromeRelevance:
      "Proves defense-contractor fabrication of directional electromagnetic energy projectors engineered to incapacitate humans at distance without kinetic munitions.",
    countermeasures: [
      "Reflective metallic blankets / aluminized Mylar shields",
      "Metal window screens (attenuates millimeter waves significantly)",
    ],
    citations: [
      "US Department of Defense Non-Lethal Weapons Directorate (JNLWD) Active Denial System reports.",
    ],
    url: "https://patents.google.com/patent/US7629918B2/en",
  },
  {
    id: "us-10816680",
    patentNumber: "US 10,816,680 B2",
    title: "Wearable Electromagnetic Radiation Detector and Alert System",
    assignee: "Specialized Defense / Sensor Technologies",
    inventors: ["David R. Smith", "Michael A. Green"],
    issueDate: "2020-10-27",
    category: "dosimetry-sensor",
    plausibility: "proven-physics",
    frequencyBand: "100 MHz – 18 GHz",
    claimedMechanism:
      "A wearable badge equipped with high-speed Schottky diode RF envelope detectors, calibrated to detect pulsed electromagnetic radiation with pulse widths down to 100 nanoseconds and trigger immediate vibration/audio alarms.",
    physicalPrinciples:
      "Fast RF peak detection: Standard average-power RF meters fail to detect the Frey effect because the average power is low while the peak power is high. A fast peak diode captures the pulse envelope before dissipation.",
    havanaSyndromeRelevance:
      "The definitive defensive sensor developed specifically to protect overseas diplomats and intelligence personnel from pulsed microwave exposure.",
    countermeasures: [
      "Wearable continuous pulse-dosimeter badges",
      "Integration with mobile phone telemetry via BLE",
    ],
    citations: [
      "Lin, J. C. (2022). Microwave Auditory Effects Among U.S. Government Personnel. IEEE Access.",
    ],
    url: "https://patents.google.com/patent/US10816680B2/en",
  },
  {
    id: "us-3951134",
    patentNumber: "US 3,951,134",
    title: "Apparatus and Method for Remotely Monitoring and Altering Brain Waves",
    assignee: "Independent / Robert G. Malech",
    inventors: ["Robert G. Malech"],
    issueDate: "1976-04-20",
    category: "directed-energy",
    plausibility: "speculative-concept",
    frequencyBand: "100 MHz – 1 GHz",
    claimedMechanism:
      "Transmits RF signals of distinct frequencies simultaneously into the brain, receives non-linear backscattered signals demodulated by biological junctions, and retransmits modulated RF to perturb EEG rhythms.",
    physicalPrinciples:
      "Non-linear junction backscatter: Biological and solid-state materials produce harmonic mixing when illuminated by multi-tone electromagnetic fields.",
    havanaSyndromeRelevance:
      "Historical patent frequently cited in declassified CIA / DIA intelligence surveys regarding Soviet and Cold War microwave influence research (the Moscow Embassy microwave bombardment).",
    countermeasures: [
      "Faraday enclosure",
      "RF spectral surveillance",
    ],
    citations: [
      "Defense Intelligence Agency (DIA) report (1976): Biological Effects of Electromagnetic Radiation.",
    ],
    url: "https://patents.google.com/patent/US3951134A/en",
  },
];

export interface ReportEntry {
  id: string;
  title: string;
  authorOrOrg: string;
  date: string;
  keyConclusions: string;
  mechanismEvaluated: string;
}

export const SCIENTIFIC_REPORTS: ReportEntry[] = [
  {
    id: "nasem-2020",
    title:
      "Consensus Study Report: An Assessment of Illness in U.S. Government Personnel at Overseas Embassies",
    authorOrOrg: "National Academies of Sciences, Engineering, and Medicine (NASEM)",
    date: "December 2020",
    keyConclusions:
      "Concluded that directed, pulsed radio frequency (RF) energy appears to be the most plausible mechanism in explaining these cases, especially in individuals with distinct early symptoms (auditory sensations, directional pressure, dizziness). Ruled out mass psychogenic illness as the primary explanation for acute cases.",
    mechanismEvaluated:
      "Pulsed Microwave / RF Radiation (Frey effect & thermoelastic cranial shockwaves).",
  },
  {
    id: "lin-ieee-2022",
    title:
      "Microwave Auditory Effects Among U.S. Government Personnel Reporting Directional Audible and Sensory Phenomena in Havana",
    authorOrOrg: "Dr. James C. Lin, University of Illinois Chicago (IEEE Access, Vol. 10)",
    date: "2022",
    keyConclusions:
      "Showed that a compact pulsed microwave system using a 1-meter parabolic antenna or phased array mounted in a delivery van or nearby room can easily project RF pulses (1–3 GHz, microsecond width, 1–10 kW/m² peak) across 50–100 meters, producing acute cochlear trauma, vestibular disruption, and severe cognitive impairment through ordinary glass windows.",
    mechanismEvaluated:
      "Microwave Auditory Effect (MAE) / High-Power Pulsed Microwave Directed Energy.",
  },
  {
    id: "fu-michigan-2018",
    title: "On Havana Syndrome: Acoustic Intermodulation of Ultrasonic Signals",
    authorOrOrg: "Prof. Kevin Fu et al., University of Michigan",
    date: "March 2018",
    keyConclusions:
      "Demonstrated that intersecting inaudible ultrasonic signals (e.g., 25 kHz and 32 kHz) from surveillance or jamming equipment mix non-linearly in air and in MEMS microphone diaphragms, generating audible intermodulation products (7 kHz) that match the exact acoustic recordings captured by diplomats in Cuba.",
    mechanismEvaluated:
      "Ultrasonic Intermodulation Distortion (IMD) & Non-linear Acoustic Mixing.",
  },
];

export function getPatentsByCategory(category: PatentCategory | "all"): PatentEntry[] {
  if (category === "all") return PATENT_DATABASE;
  return PATENT_DATABASE.filter((p) => p.category === category);
}

export function searchPatents(query: string, category: PatentCategory | "all"): PatentEntry[] {
  const list = getPatentsByCategory(category);
  if (!query.trim()) return list;
  const q = query.toLowerCase();
  return list.filter(
    (p) =>
      p.patentNumber.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      p.assignee.toLowerCase().includes(q) ||
      p.claimedMechanism.toLowerCase().includes(q) ||
      p.physicalPrinciples.toLowerCase().includes(q) ||
      p.havanaSyndromeRelevance.toLowerCase().includes(q)
  );
}
