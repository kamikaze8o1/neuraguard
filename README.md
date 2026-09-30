# NeuraGuard / NeuraProbe

A greenfield, standalone Next.js app with **two sides**:

- **NeuraGuard** — a personal neurorights / BCI consent OS. *"Your mind. Your rules."*
- **NeuraProbe** — a transparent, consent-gated sensor-fusion acquisition lab. *"What can be sensed without your charter."*

They share one site shell (nav, typography, PWA shell) but are visually and functionally distinct, and neither has any relationship to DistroSafe — no shared branding, auth, routes, or backend.

**Everything in this app runs on-device.** There is no backend, no database, no accounts, and no network calls other than loading the app itself. All persistence is `localStorage` / `IndexedDB`, and every "export" is a local file download you trigger yourself.

Public source: [github.com/kamikaze8o1/neuraguard](https://github.com/kamikaze8o1/neuraguard). MIT license.

## The two sides

### NeuraGuard (defense)

| Route | What it does |
|---|---|
| `/` | Dual landing page introducing both sides |
| `/charter` | Build a Neuro Charter across 6 pillars (Mental Privacy, Cognitive Liberty, Mental Integrity, Personal Identity & Continuity, Fair Access, Bias Protection). Persists to `localStorage`; view/download as a machine-readable JSON ruleset |
| `/ledger` | Local consent ledger: add/edit device & app access grants, one-tap "Revoke all neural access", export/import as JSON |
| `/lab` | Permission Lab — scripted BCI access-request scenarios; choose Allow / Allow once / Deny, see the plain-language consequence, optionally log the decision to your ledger |
| `/decode` | Policy Decoder — curated templates (consumer headset, clinical BCI, workplace wellness band) decoded into plain language with Privacy/Agency/Integrity risk chips, **plus** a mobile-first upload flow (photo/PDF/.txt/.md) that extracts text client-side and runs the same heuristic decode on your own documents |
| `/c/[payload]` | Read-only, shareable charter card — the charter is compressed into the URL itself (via `lz-string`) and decoded entirely in the visitor's browser. No server, no database |
| `/patents` | Electromagnetic & Acoustic Patent Registry — exhaustive technical database and biophysical analysis of patents covering the Frey Effect, Microwave Auditory Effect, acoustic heterodyning, and directed energy related to Havana Syndrome / Anomalous Health Incidents |

### NeuraProbe (acquisition demo)

| Route | What it does |
|---|---|
| `/probe` | Consent Gate — explicit educational-use disclaimer + per-channel checkboxes (Camera, Motion, Bluetooth, Audio). If a NeuraGuard charter on this device denies read/infer for the related pillar, the channel shows **"Blocked by your Neuro Charter"** and requires typing `OVERRIDE` to proceed |
| `/probe/live` | Live fusion dashboard — camera-based PPG (BPM, RR tachogram, RMSSD/SDNN proxy), DeviceMotion-based "scapular tension/asymmetry" proxy, optional Web Bluetooth Heart Rate Service (0x180D) merge, and a visible "Stop all sensors" control |
| `/probe/incident` | Anomalous Signal & Incident Monitor — real-time 4096-point FFT spectrogram, ultrasonic carrier detection (15–24 kHz), periodic harmonic pulse train detection (audio rectification signature of pulsed RF / radar / MAE), vestibular postural tremor tracking, and tamper-evident forensic JSON incident dossier export |
| `/probe/triangulate` | Signal Reverse Engineering & Geolocation Suite — interactive 2D TDoA hyperbolic multilateration map, PRF envelope analysis, microsecond pulse width estimation, and emitter signature classification |
| `/probe/aep` | Oddball auditory evoked-potential session — standard (1000Hz) vs deviant (1500Hz) tones via Web Audio, epoched against whatever camera/motion channels are active, averaged per condition, plotted, and summarized as a fusion consistency score |

## Getting started

```bash
cd neuraguard
npm install
npm run dev
```

Then open `http://localhost:3000`. For the camera/motion/Bluetooth features you'll want to test on an actual phone — see permissions below.

```bash
npm run build   # production build, type-checked
npm run start   # serve the production build
```

## Browser permissions this app asks for

| Permission | Used for | Notes |
|---|---|---|
| **Camera** | NeuraProbe PPG heart-rate estimation | Cover the rear camera with a fingertip in steady light. No video is stored or transmitted — only per-frame average red-channel intensity is processed in memory. |
| **Motion sensors** (`DeviceMotionEvent`) | NeuraProbe scapular tension/asymmetry proxy | iOS 13+ requires an explicit tap-triggered permission prompt (`DeviceMotionEvent.requestPermission()`), which the Motion panel handles for you. Desktops without motion sensors will show "not supported." |
| **Bluetooth** (Web Bluetooth) | Optional Heart Rate Service (0x180D) peripheral | **Chromium-only.** Unsupported on iOS Safari and Firefox — the panel detects this and shows a "not supported" state instead of crashing. |
| **Audio output** | AEP oddball tone playback | Speakers or headphones only. |
| **Microphone** | Incident monitor and `/probe/triangulate` live analysis | Optional, and only after you press start. A 4096-point FFT of the mic. It does not receive radio. |

No permission is ever requested passively; every sensor requires a user tap on the corresponding "Start" / "Connect" control, and NeuraProbe's Consent Gate (`/probe`) must be acknowledged first.

## Privacy posture

- No accounts, no sign-in, no server-side data persistence, no database.
- NeuraGuard's charter, ledger, and uploaded documents live in this browser's `localStorage` / `IndexedDB` only.
- NeuraProbe's sensor samples, AEP epochs, and fusion scores live only in page memory during your session; the only way they leave the page is if *you* click an explicit "Export session JSON" button, which downloads a local file.
- The shared charter link (`/c/[payload]`) encodes the entire charter into the URL itself (compressed with `lz-string`) — there is no server round-trip to generate or resolve it.
- A service worker (`public/sw.js`) caches the app shell and NeuraGuard's static routes for offline use after first load. It does not intercept or cache anything sensor-related, and NeuraProbe's live sensor pages obviously require the device to actually be online... no — they require *live hardware*, not network; they'll load offline too, they just can't do anything meaningful without a camera/motion/Bluetooth device attached regardless of connectivity.

## Ethical / educational-use disclaimers for NeuraProbe

**NeuraProbe is an educational demonstration of real sensor-fusion acquisition techniques — it is not a medical or diagnostic device, and none of its outputs (BPM, HRV proxies, tension/asymmetry proxies, or the AEP "fusion evoked score") should be treated as clinically validated measurements.**

- Do not use NeuraProbe to monitor, assess, or make decisions about anyone other than yourself, with their full, informed, in-person consent.
- Do not use it for employment screening, insurance risk scoring, covert surveillance, or any application where someone is being sensed without their knowledge and active participation.
- The AEP ("evoked-response proxy") test does **not** measure real EEG/electrophysiology (no N100/N200/P300 potentials are recorded). It infers a proxy signal from cardiovascular (PPG) and motion micro-reactions time-locked to audio stimuli. A path exists for a BLE EEG-capable device to contribute real electrophysiology, but no such device integration is implemented in this build — see "Simplifications" below.
- If a NeuraGuard charter on the same device denies read/infer access for a related pillar, NeuraProbe will show a real functional block on that channel, not just a warning banner. The typed `OVERRIDE` confirmation exists so you can still explore the demo on yourself, but it is a deliberate friction point, not a bypass to use lightly.

## Architecture notes

```
neuraguard/
  app/                     Next.js App Router routes (see tables above)
  components/
    guard/                 NeuraGuard UI (charter, ledger, lab, decode, share)
    probe/                 NeuraProbe UI (consent gate, live fusion, AEP)
  lib/
    guard/                 Charter engine, ledger, decode templates + heuristics,
                            IndexedDB upload storage, lz-string share codec
    probe/                 Sensor engines: ppg.ts, motion.ts, ble.ts, plus
                            aep.ts (oddball scheduling + epoching) and
                            fusion.ts (consistency scoring + session export)
  types/web-apis.d.ts       Ambient TypeScript declarations for Web Bluetooth
                            and the iOS DeviceMotionEvent.requestPermission() API
  public/
    manifest.json, icon.svg, sw.js
```

No authentication, no database, no server API routes. Pages are Next.js Server Components where they're static; every interactive piece (charter builder, ledger, scenarios, decoder, and all of NeuraProbe) is an explicit Client Component.

## Known simplifications / deferred scope

These were deliberately simplified to keep the MVP shippable and dependency-light, per the project's "hand-roll simple peak detection and averaging, don't over-engineer" guidance:

- **PPG peak detection** is a simple rolling-mean/threshold detector with a refractory period — not a clinical-grade algorithm (no bandpass filtering, no motion-artifact rejection). Treat BPM/RMSSD/SDNN as rough proxies.
- **Image OCR is intentionally not implemented.** Uploaded photos are stored as-is; the user types/pastes a caption or transcription instead, per the spec's "no server OCR needed for this MVP."
- **BLE EEG integration is a no-op path, not a real feature.** The AEP fusion score only ever combines PPG + motion channels in this build; a BLE EEG characteristic listener was out of scope to avoid faking electrophysiology data.
- **`/probe/live`'s "Export session JSON"** exports the latest fused HR estimate, buffered raw PPG/motion samples (last ~2000 samples each), and consent/override state — it does not include AEP data (that lives in the `/probe/aep` export instead, which includes full stimuli + epochs + fusion score). A single unified "whole app state" export was considered unnecessary complexity for two independent demo flows.
- **PWA icons are a single scalable SVG** (`public/icon.svg`), referenced with `"sizes": "any"` in the manifest, rather than a generated set of PNG raster sizes — simpler to maintain and sufficient for modern browsers; iOS's non-standard apple-touch-icon PNG convention may render less crisply on old iOS versions as a result.
- **Web Bluetooth device selection uses the browser's native picker** (`navigator.bluetooth.requestDevice`); there's no custom in-app device list UI.
- Tailwind CSS v3 (classic config) was used instead of v4 for stability with the exact dependency set pinned during scaffolding.

## Browser-capability caveats (surfaced in-app too)

- **Web Bluetooth** is Chromium-only — unsupported on iOS Safari and Firefox. The Bluetooth panel detects this and shows "not supported" rather than failing silently.
- **iOS motion permission**: iOS 13+ requires a user-gesture-triggered `DeviceMotionEvent.requestPermission()` call, handled by the Motion panel's "Start" button. Other browsers skip this step automatically.
- **Camera-based PPG accuracy** varies significantly with lighting, motion, and finger placement — this is explicitly labeled as a proxy, not a validated pulse oximeter, throughout the UI.
- **AEP "evoked-response proxy"** reflects cardiovascular/motion micro-reactions and audio timing, not real EEG electrophysiology.
- **`/probe/triangulate`** solves TDoA and AoA on simulated sensor timings you drag on a map. Acoustic mode is millisecond-scale. RF mode uses the speed of light on synthetic timestamps. It does not measure a live microwave emitter, and a phone cannot time nanosecond arrivals.
- **Pulse width (τ ≈ 1/f_null)** on the reverse-engineering tab is an estimate from the audio spectrum of a file or the microphone, not a measured RF pulse.
