// Real-time acoustic and ultrasonic analysis engine for NeuraProbe.
// Leverages Web Audio API with a 4096-point FFT to analyze:
// 1. High-frequency & ultrasonic spectrum (15 kHz - 24 kHz) for carrier tones and intermodulation.
// 2. Harmonic pulse train / audio rectification artifacts (the acoustic signature
//    of pulsed microwaves / RF coupling into non-linear microphone junctions).
// 3. Spectral crest factor and acoustic impulsiveness.

export interface AcousticMetrics {
  sampleRate: number;
  fftSize: number;
  binResolution: number; // Hz per bin
  overallRmsDb: number; // approximate dBFS (-100 to 0)
  peakFrequency: number; // Hz
  peakDb: number; // dBFS
  // Ultrasonic Band (15 kHz - 24 kHz)
  ultrasonic: {
    peakFrequency: number; // Hz
    peakDb: number; // dBFS
    avgPowerDb: number; // dBFS
    isCarrierDetected: boolean;
  };
  // Rectification / Pulse Repetition Frequency (PRF) detection
  rectification: {
    crestFactor: number; // Peak / RMS ratio (higher = impulsive/pulsed)
    isHarmonicTrainDetected: boolean;
    estimatedPrfHz: number | null; // e.g. 500 Hz, 1000 Hz, 7000 Hz
    harmonicPeakCount: number;
  };
  // Prominent resonant peaks
  topPeaks: Array<{ freq: number; db: number }>;
}

export interface AcousticStreamController {
  stop: () => void;
  getMetrics: () => AcousticMetrics | null;
  getFrequencyData: () => Uint8Array | null;
  getTimeDomainData: () => Uint8Array | null;
}

export async function startAcousticAnalyzer(
  onUpdate?: (metrics: AcousticMetrics) => void
): Promise<AcousticStreamController> {
  if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Acoustic analysis is only supported in browser environments with microphone access.");
  }

  // Request raw audio without destructive browser processing
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  });

  const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const source = audioCtx.createMediaStreamSource(stream);

  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 4096; // 2048 frequency bins
  analyser.smoothingTimeConstant = 0.65;
  source.connect(analyser);

  const bufferLength = analyser.frequencyBinCount; // 2048
  const freqData = new Float32Array(bufferLength);
  const freqDataUint8 = new Uint8Array(bufferLength);
  const timeDataUint8 = new Uint8Array(analyser.fftSize);

  let active = true;
  let latestMetrics: AcousticMetrics | null = null;
  let animId = 0;

  const binRes = audioCtx.sampleRate / analyser.fftSize; // e.g. 48000 / 4096 = 11.72 Hz per bin
  const ultrasonicStartBin = Math.floor(15000 / binRes); // ~15 kHz
  const ultrasonicEndBin = Math.min(bufferLength - 1, Math.floor(24000 / binRes));

  function analyzeFrame() {
    if (!active) return;

    analyser.getFloatFrequencyData(freqData);
    analyser.getByteFrequencyData(freqDataUint8);
    analyser.getByteTimeDomainData(timeDataUint8);

    // 1. Overall Peak & RMS
    let maxDb = -Infinity;
    let maxBin = 0;
    let sumLinear = 0;

    for (let i = 2; i < bufferLength; i++) {
      const db = freqData[i];
      if (db > maxDb) {
        maxDb = db;
        maxBin = i;
      }
      sumLinear += Math.pow(10, db / 20);
    }
    const rmsLinear = sumLinear / (bufferLength - 2);
    const overallRmsDb = 20 * Math.log10(Math.max(1e-5, rmsLinear));
    const peakFreq = Math.round(maxBin * binRes);

    // 2. Ultrasonic Band (15 kHz - 24 kHz)
    let ultraMaxDb = -Infinity;
    let ultraMaxBin = ultrasonicStartBin;
    let ultraSum = 0;
    let ultraCount = 0;

    for (let i = ultrasonicStartBin; i <= ultrasonicEndBin; i++) {
      const db = freqData[i];
      if (db > ultraMaxDb) {
        ultraMaxDb = db;
        ultraMaxBin = i;
      }
      ultraSum += db;
      ultraCount++;
    }
    const ultraAvgDb = ultraCount ? ultraSum / ultraCount : -100;
    const ultraPeakFreq = Math.round(ultraMaxBin * binRes);
    // Carrier detected if peak stands >= 18 dB above ultrasonic floor and peak is above -70 dBFS
    const isCarrierDetected = ultraMaxDb > -70 && ultraMaxDb - ultraAvgDb > 18;

    // 3. Rectification & Pulse Repetition Frequency (PRF) Detection
    // Check for periodic harmonic spikes in the range 200 Hz - 8000 Hz
    let crestFactor = 0;
    if (rmsLinear > 1e-4) {
      crestFactor = Math.pow(10, (maxDb - overallRmsDb) / 20);
    }

    // Identify local peaks above background
    const peaks: Array<{ bin: number; freq: number; db: number }> = [];
    for (let i = 10; i < bufferLength - 10; i++) {
      const v = freqData[i];
      if (v > -75 && v > freqData[i - 1] && v > freqData[i + 1] && v > freqData[i - 2] && v > freqData[i + 2]) {
        peaks.push({ bin: i, freq: Math.round(i * binRes), db: v });
      }
    }

    // Sort descending by dB
    peaks.sort((a, b) => b.db - a.db);
    const topPeaks = peaks.slice(0, 5).map((p) => ({ freq: p.freq, db: Math.round(p.db) }));

    // Harmonic check: if we have 3 or more prominent peaks whose frequency differences are multiples of each other
    let isHarmonicTrain = false;
    let estimatedPrf: number | null = null;
    let harmonicCount = 0;

    if (peaks.length >= 3) {
      // Test candidate fundamentals (100 Hz to 7500 Hz)
      for (const p of peaks.slice(0, 6)) {
        const candidate = p.freq;
        if (candidate < 80) continue;
        let hits = 0;
        for (const other of peaks) {
          const ratio = other.freq / candidate;
          const nearestInt = Math.round(ratio);
          if (nearestInt >= 1 && nearestInt <= 8 && Math.abs(ratio - nearestInt) < 0.05) {
            hits++;
          }
        }
        if (hits >= 3 && hits > harmonicCount) {
          harmonicCount = hits;
          estimatedPrf = candidate;
          isHarmonicTrain = true;
        }
      }
    }

    const metrics: AcousticMetrics = {
      sampleRate: audioCtx.sampleRate,
      fftSize: analyser.fftSize,
      binResolution: Math.round(binRes * 10) / 10,
      overallRmsDb: Math.round(overallRmsDb),
      peakFrequency: peakFreq,
      peakDb: Math.round(maxDb),
      ultrasonic: {
        peakFrequency: ultraPeakFreq,
        peakDb: Math.round(ultraMaxDb),
        avgPowerDb: Math.round(ultraAvgDb),
        isCarrierDetected,
      },
      rectification: {
        crestFactor: Math.round(crestFactor * 10) / 10,
        isHarmonicTrainDetected: isHarmonicTrain,
        estimatedPrfHz: estimatedPrf,
        harmonicPeakCount: harmonicCount,
      },
      topPeaks,
    };

    latestMetrics = metrics;
    onUpdate?.(metrics);

    animId = requestAnimationFrame(analyzeFrame);
  }

  animId = requestAnimationFrame(analyzeFrame);

  return {
    stop: () => {
      active = false;
      cancelAnimationFrame(animId);
      stream.getTracks().forEach((track) => track.stop());
      audioCtx.close().catch(() => {});
    },
    getMetrics: () => latestMetrics,
    getFrequencyData: () => (active ? freqDataUint8 : null),
    getTimeDomainData: () => (active ? timeDataUint8 : null),
  };
}
