// Signal Reverse Engineering & Emitter Signature Classification Engine
// Analyzes audio baseband, rectification artifacts, and ultrasonic recordings.

export interface EmitterClassification {
  profileName: string;
  confidenceScore: number; // 0 - 100
  threatTier: "low" | "medium" | "high" | "critical";
  description: string;
  characteristics: string[];
  recommendedCountermeasures: string[];
}

export interface ReverseEngineeringReport {
  timestamp: string;
  fundamentalPrfHz: number; // Pulse Repetition Frequency
  pulseIntervalMs: number; // Interval between pulses
  estimatedPulseWidthUs: number; // Microseconds duration of RF/acoustic pulse
  dutyCyclePercent: number; // Duty cycle
  crestFactor: number; // Peak to RMS ratio
  harmonicCount: number; // Detected harmonic spikes
  spectralSincNullHz: number | null; // First spectral null
  topHarmonics: number[];
  cepstralPrfHz: number | null;
  classification: EmitterClassification;
}

/**
 * Calculates autocorrelation sequence of audio buffer to extract fundamental period.
 */
export function computeAutocorrelation(
  buffer: Float32Array,
  sampleRate = 48000
): { bestLag: number; maxCorrelation: number } {
  const n = buffer.length;
  let maxCorr = -1;
  let bestLag = 0;

  // Search lags corresponding to about 50 Hz–12 kHz at the file's sample rate.
  const minLag = Math.max(2, Math.floor(sampleRate / 12000));
  const maxLag = Math.min(Math.floor(n / 2), Math.floor(sampleRate / 50));

  // Compute energy
  let energy = 0;
  for (let i = 0; i < n; i++) energy += buffer[i] * buffer[i];
  if (energy < 1e-6) return { bestLag: 0, maxCorrelation: 0 };

  for (let lag = minLag; lag < maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < n - lag; i++) {
      sum += buffer[i] * buffer[i + lag];
    }
    const normCorr = sum / energy;
    if (normCorr > maxCorr) {
      maxCorr = normCorr;
      bestLag = lag;
    }
  }

  return { bestLag, maxCorrelation: Math.max(0, maxCorr) };
}

/**
 * Classifies an emitter based on extracted PRF, pulse width, and harmonic structure.
 */
export function classifyEmitterSignature(input: {
  prfHz: number;
  pulseWidthUs: number;
  crestFactor: number;
  harmonicCount: number;
  isUltrasonicCarrier: boolean;
}): EmitterClassification {
  const { prfHz, pulseWidthUs, crestFactor, harmonicCount, isUltrasonicCarrier } = input;

  // Profile 1: Pulsed Microwave Auditory Effect (Frey Effect / MAE)
  // Hallmarks: High crest factor (>4x), microsecond pulses (<25 µs), PRF typically 500 Hz - 8 kHz, strong rectification harmonics
  if (prfHz >= 400 && prfHz <= 8500 && pulseWidthUs <= 30 && crestFactor >= 3.5 && harmonicCount >= 3) {
    return {
      profileName: "Pulsed Microwave Auditory Effect (Frey Effect / MAE)",
      confidenceScore: Math.min(96, Math.round(50 + crestFactor * 6 + harmonicCount * 4)),
      threatTier: "critical",
      description:
        "Consistent with high-peak pulsed RF/microwave radiation (200 MHz–3 GHz) demodulating into audio circuitry via non-linear rectification. The pulse repetition frequency matches clinical MAE thermoelastic shockwave reports.",
      characteristics: [
        `PRF: ${prfHz} Hz with sharp microsecond pulse rise time (${pulseWidthUs} µs)`,
        `High crest factor (${crestFactor}x) indicative of low-duty-cycle pulsed energy`,
        `Dense harmonic train indicative of diode envelope rectification`,
      ],
      recommendedCountermeasures: [
        "Deploy architectural copper-mesh RF window films or Faraday shielding curtains",
        "Record simultaneous RF wideband spectrum via Software Defined Radio (SDR)",
        "Relocate away from line-of-sight exterior windows facing open streets/rooftops",
      ],
    };
  }

  // Profile 2: Parametric Ultrasonic Beam / Acoustic Heterodyne (LRAD / HSS)
  // Hallmarks: High frequency carrier (>15 kHz or active ultrasonic detector) + audible difference tone
  if (isUltrasonicCarrier || (prfHz >= 1000 && prfHz <= 5000 && crestFactor < 3.0)) {
    return {
      profileName: "Parametric Acoustic Array / Ultrasonic Beam",
      confidenceScore: 88,
      threatTier: "high",
      description:
        "Consistent with an ultrasonic carrier self-demodulating in air or non-linear surfaces via parametric acoustic array technology (e.g. US Patent 5,889,870). Sound is intensely directional.",
      characteristics: [
        "Inaudible or near-ultrasonic carrier with directional acoustic projection",
        "Demodulated audio beam confined to narrow line-of-sight cone",
        "Rapid spatial drop-off when stepping inches outside the acoustic beam",
      ],
      recommendedCountermeasures: [
        "Standard high-attenuation acoustic earplugs or active noise-canceling headphones (effective against airborne ultrasound)",
        "Mass-loaded vinyl barriers and acoustic laminated glass",
      ],
    };
  }

  // Profile 3: Ultrasonic Intermodulation / Covert Bug or Jammer
  // Hallmarks: Discrete frequencies near 7 kHz, 14 kHz, 21 kHz
  if (Math.abs(prfHz - 7000) < 600 || Math.abs(prfHz - 14000) < 600) {
    return {
      profileName: "Ultrasonic Intermodulation (Kevin Fu / Havana Signature)",
      confidenceScore: 92,
      threatTier: "high",
      description:
        "Strong spectral match to the 7.0 kHz intermodulation distortion pattern documented in the University of Michigan 2018 study. Often caused by multiple ultrasonic sources mixing in MEMS microphone diaphragms.",
      characteristics: [
        "Characteristic ~7 kHz fundamental with harmonic overtones at 14 kHz and 21 kHz",
        "Matches acoustic recordings published by AP from Havana embassy staff",
      ],
      recommendedCountermeasures: [
        "Deploy ultrasonic microphone sweeps (up to 40–100 kHz with specialized transducer)",
        "Inspect perimeter for misaligned ultrasonic surveillance bugs or jammers",
      ],
    };
  }

  // Profile 4: Power Grid / AC Electrical Hum
  if (Math.abs(prfHz - 60) < 3 || Math.abs(prfHz - 120) < 5 || Math.abs(prfHz - 50) < 3 || Math.abs(prfHz - 100) < 5) {
    return {
      profileName: "AC Electrical Grid Hum / Magnetostriction",
      confidenceScore: 95,
      threatTier: "low",
      description:
        "Benign 50/60 Hz mains electricity hum or 100/120 Hz rectified harmonic vibration from power supplies, lighting transformers, or heavy appliances.",
      characteristics: ["Matches standard mains electrical frequency", "Low crest factor, steady-state continuous tone"],
      recommendedCountermeasures: ["Check grounding of nearby audio equipment and power adapters"],
    };
  }

  // Natural / environmental: sparse spectrum, modest crest, no ultrasonic carrier.
  // Covers mains already handled above, plus insect-band chirps and coil whine.
  if (!isUltrasonicCarrier && harmonicCount <= 2 && crestFactor < 4 && prfHz >= 200 && prfHz <= 9000) {
    return {
      profileName: "Natural / Environmental Artifact",
      confidenceScore: 70,
      threatTier: "low",
      description:
        "Sparse spectrum without a dense rectification comb. Consistent with insect-band chirps, transformer or coil whine, or other ordinary room sound. This is not a microwave identification.",
      characteristics: [
        `Dominant tone near ${Math.round(prfHz)} Hz`,
        `Crest factor ${crestFactor.toFixed(1)}x with ${harmonicCount} prominent line(s)`,
      ],
      recommendedCountermeasures: ["No directed-energy match. Treat the capture as ordinary background unless a denser harmonic comb appears."],
    };
  }

  // Fallback: Unclassified Impulsive Acoustic Source
  return {
    profileName: "Unclassified Ambient / Transient Signal",
    confidenceScore: 45,
    threatTier: "medium",
    description:
      "Acoustic frequency activity detected, but pulse parameters do not match verified directed energy or ultrasonic profiles. May represent environmental background or digital switching noise.",
    characteristics: [
      `Peak / PRF: ${prfHz} Hz`,
      `Crest Factor: ${crestFactor}x`,
      `Harmonics: ${harmonicCount}`,
    ],
    recommendedCountermeasures: ["Continue monitoring and capture an incident snapshot during peak exposure"],
  };
}

/**
 * Reverse-engineers an audio sample into a complete forensic analysis report.
 */
export function reverseEngineerAudioSignal(
  peaks: Array<{ freq: number; db: number }>,
  sampleRate = 48000,
  isUltrasonic = false,
  crestFactor = 3.0
): ReverseEngineeringReport {
  // Sort peaks ascending by frequency
  const sorted = [...peaks].sort((a, b) => a.freq - b.freq);

  // Determine fundamental PRF from spacing of harmonic peaks
  let fundamentalPrf = sorted[0]?.freq || 1000;
  let harmonicCount = sorted.length;

  if (sorted.length >= 2) {
    const diffs: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const d = sorted[i].freq - sorted[i - 1].freq;
      if (d > 50) diffs.push(d);
    }
    if (diffs.length > 0) {
      const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      if (avgDiff > 80 && avgDiff < 12000) {
        fundamentalPrf = Math.round(avgDiff);
      }
    }
  }

  const pulseIntervalMs = Math.round((1000 / fundamentalPrf) * 100) / 100;

  // Pulse width estimation: if harmonics extend to high frequency before a dip,
  // tau ≈ 1 / f_null. For typical radar/MAE, tau is 0.5 to 25 microseconds.
  const highestHarmonic = sorted[sorted.length - 1]?.freq || 8000;
  const estimatedPulseWidthUs = Math.max(1.5, Math.min(250, Math.round(1000000 / (highestHarmonic * 1.5))));
  const dutyCyclePercent = Math.round(((estimatedPulseWidthUs / 1000) / pulseIntervalMs) * 1000) / 10;

  const classification = classifyEmitterSignature({
    prfHz: fundamentalPrf,
    pulseWidthUs: estimatedPulseWidthUs,
    crestFactor,
    harmonicCount,
    isUltrasonicCarrier: isUltrasonic,
  });

  return {
    timestamp: new Date().toISOString(),
    fundamentalPrfHz: fundamentalPrf,
    pulseIntervalMs,
    estimatedPulseWidthUs,
    dutyCyclePercent,
    crestFactor: Math.round(crestFactor * 10) / 10,
    harmonicCount,
    spectralSincNullHz: highestHarmonic > 10000 ? highestHarmonic : null,
    topHarmonics: sorted.slice(0, 8).map((p) => p.freq),
    cepstralPrfHz: null,
    classification,
  };
}

function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

function fftInPlace(re: Float64Array, im: Float64Array, inverse = false): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i];
      re[i] = re[j];
      re[j] = tr;
      const ti = im[i];
      im[i] = im[j];
      im[j] = ti;
    }
  }
  const sign = inverse ? 1 : -1;
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (sign * 2 * Math.PI) / len;
    const wlenRe = Math.cos(ang);
    const wlenIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let wRe = 1;
      let wIm = 0;
      for (let j = 0; j < len / 2; j++) {
        const uRe = re[i + j];
        const uIm = im[i + j];
        const vRe = re[i + j + len / 2] * wRe - im[i + j + len / 2] * wIm;
        const vIm = re[i + j + len / 2] * wIm + im[i + j + len / 2] * wRe;
        re[i + j] = uRe + vRe;
        im[i + j] = uIm + vIm;
        re[i + j + len / 2] = uRe - vRe;
        im[i + j + len / 2] = uIm - vIm;
        const nextRe = wRe * wlenRe - wIm * wlenIm;
        wIm = wRe * wlenIm + wIm * wlenRe;
        wRe = nextRe;
      }
    }
  }
  if (inverse) {
    for (let i = 0; i < n; i++) {
      re[i] /= n;
      im[i] /= n;
    }
  }
}

/**
 * Analyze one PCM window. Peaks, PRF, and pulse-width come from this buffer.
 * Pulse width uses the first deep spectral dip (τ ≈ 1 / f_null) and is an
 * audio-envelope estimate, not a measured RF pulse.
 */
export function analyzePcmSegment(samples: Float32Array, sampleRate: number): ReverseEngineeringReport {
  const n = Math.min(4096, nextPow2(Math.max(256, samples.length)));
  const re = new Float64Array(n);
  const im = new Float64Array(n);
  let peakAbs = 0;
  let sumSq = 0;
  const offset = Math.max(0, Math.floor((samples.length - n) / 2));
  for (let i = 0; i < n; i++) {
    const s = samples[offset + i] ?? 0;
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
    re[i] = s * w;
    peakAbs = Math.max(peakAbs, Math.abs(s));
    sumSq += s * s;
  }
  const rms = Math.sqrt(sumSq / n) || 1e-8;
  const crestFactor = Math.max(1, peakAbs / rms);

  fftInPlace(re, im, false);
  const bins = n / 2;
  const magDb = new Float64Array(bins);
  let magSum = 0;
  for (let k = 0; k < bins; k++) {
    const mag = Math.hypot(re[k], im[k]) / n;
    magDb[k] = 20 * Math.log10(mag + 1e-12);
    magSum += magDb[k];
  }
  const meanDb = magSum / bins;
  const peaks: Array<{ freq: number; db: number }> = [];
  for (let k = 2; k < bins - 1; k++) {
    if (magDb[k] > magDb[k - 1] && magDb[k] >= magDb[k + 1] && magDb[k] > meanDb + 8) {
      peaks.push({ freq: Math.round((k * sampleRate) / n), db: Math.round(magDb[k] * 10) / 10 });
    }
  }
  peaks.sort((a, b) => b.db - a.db);
  const top = peaks.slice(0, 8).sort((a, b) => a.freq - b.freq);

  const binHz = sampleRate / n;
  const u0 = Math.floor(15000 / binHz);
  const u1 = Math.min(bins - 1, Math.floor(24000 / binHz));
  let uSum = 0;
  let uCount = 0;
  let uPeak = -200;
  for (let k = u0; k <= u1; k++) {
    uSum += magDb[k];
    uCount++;
    if (magDb[k] > uPeak) uPeak = magDb[k];
  }
  const uAvg = uCount ? uSum / uCount : -200;
  const isUltrasonic = u1 > u0 && uPeak > meanDb + 12 && uAvg > meanDb + 4;

  let sincNullHz: number | null = null;
  let seenPeak = false;
  for (let k = 3; k < bins - 2; k++) {
    const freq = (k * sampleRate) / n;
    if (freq < 500) continue;
    if (magDb[k] > meanDb + 10) seenPeak = true;
    if (seenPeak && magDb[k] < meanDb - 6 && magDb[k + 1] < meanDb - 4) {
      sincNullHz = Math.round(freq);
      break;
    }
  }

  const timeWindow = samples.subarray(offset, Math.min(samples.length, offset + n));
  const ac = computeAutocorrelation(timeWindow, sampleRate);
  const acPrf = ac.bestLag > 0 && ac.maxCorrelation > 0.25 ? sampleRate / ac.bestLag : 0;

  const logRe = new Float64Array(n);
  const logIm = new Float64Array(n);
  for (let k = 0; k < bins; k++) {
    logRe[k] = Math.log(Math.hypot(re[k], im[k]) + 1e-12);
    logRe[n - 1 - k] = logRe[k];
  }
  fftInPlace(logRe, logIm, true);
  let cepstralPrfHz: number | null = null;
  const qMin = Math.max(2, Math.floor(sampleRate / 8000));
  const qMax = Math.min(Math.floor(n / 2) - 1, Math.floor(sampleRate / 80));
  let bestQ = 0;
  let bestC = 0;
  for (let q = qMin; q <= qMax; q++) {
    const c = Math.abs(logRe[q]);
    if (c > bestC) {
      bestC = c;
      bestQ = q;
    }
  }
  if (bestQ > 0) cepstralPrfHz = Math.round(sampleRate / bestQ);

  const report = reverseEngineerAudioSignal(top, sampleRate, isUltrasonic, crestFactor);
  const prf = acPrf > 80 && acPrf < 12000 ? Math.round(acPrf) : report.fundamentalPrfHz;
  const pulseWidthUs = sincNullHz
    ? Math.max(1, Math.min(500, Math.round(1_000_000 / sincNullHz)))
    : report.estimatedPulseWidthUs;
  const pulseIntervalMs = Math.round((1000 / prf) * 100) / 100;
  const classification = classifyEmitterSignature({
    prfHz: prf,
    pulseWidthUs,
    crestFactor,
    harmonicCount: top.length,
    isUltrasonicCarrier: isUltrasonic,
  });

  return {
    ...report,
    fundamentalPrfHz: prf,
    pulseIntervalMs,
    estimatedPulseWidthUs: pulseWidthUs,
    dutyCyclePercent: Math.round((pulseWidthUs / 1000 / pulseIntervalMs) * 1000) / 10,
    crestFactor: Math.round(crestFactor * 10) / 10,
    harmonicCount: top.length,
    spectralSincNullHz: sincNullHz,
    topHarmonics: top.map((p) => p.freq),
    cepstralPrfHz,
    classification,
  };
}
