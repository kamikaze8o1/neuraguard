"use client";

import { useState } from "react";
import { TriangulationMap } from "@/components/probe/TriangulationMap";
import { SignalReverseEngineer } from "@/components/probe/SignalReverseEngineer";
import Link from "next/link";
import clsx from "@/lib/clsx";

export default function TriangulatePage() {
  const [activeTab, setActiveTab] = useState<"triangulate" | "reverse-engineer" | "hardware">("triangulate");

  return (
    <div className="side-probe bg-probe-gradient min-h-full">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-probe-border bg-probe-surface px-2.5 py-1 text-xs font-mono font-semibold uppercase tracking-wider text-probe-accent">
              NeuraProbe · SIGINT &amp; Forensics
            </span>
            <span className="text-xs text-probe-muted">Signal Characterization &amp; Geolocation</span>
          </div>
          <h1 className="text-3xl font-semibold text-probe-ink sm:text-4xl">
            Signal Reverse Engineering &amp; Triangulation Suite
          </h1>
          <p className="max-w-3xl text-sm text-probe-muted">
            Forensic toolset to reverse-engineer pulse repetition envelopes from audio/rectification captures
            and track the physical origination point of directed acoustic or RF microwave emitters via
            <strong> Time Difference of Arrival (TDoA)</strong> and <strong>Angle of Arrival (AoA)</strong>.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mt-8 flex flex-wrap gap-2 border-b border-probe-border pb-3 text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => setActiveTab("triangulate")}
            className={clsx(
              "rounded-lg px-4 py-2 font-medium transition-colors",
              activeTab === "triangulate"
                ? "bg-probe-accent text-probe-bg font-semibold"
                : "text-probe-muted hover:bg-probe-surface2 hover:text-probe-ink"
            )}
          >
            1. TDoA Multilateration Map
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("reverse-engineer")}
            className={clsx(
              "rounded-lg px-4 py-2 font-medium transition-colors",
              activeTab === "reverse-engineer"
                ? "bg-probe-accent text-probe-bg font-semibold"
                : "text-probe-muted hover:bg-probe-surface2 hover:text-probe-ink"
            )}
          >
            2. PRF &amp; Envelope Reverse Engineering
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("hardware")}
            className={clsx(
              "rounded-lg px-4 py-2 font-medium transition-colors",
              activeTab === "hardware"
                ? "bg-probe-accent text-probe-bg font-semibold"
                : "text-probe-muted hover:bg-probe-surface2 hover:text-probe-ink"
            )}
          >
            3. SDR &amp; Direction-Finding Guide
          </button>
        </div>

        {/* Content */}
        <div className="mt-6">
          {activeTab === "triangulate" && <TriangulationMap />}
          {activeTab === "reverse-engineer" && <SignalReverseEngineer />}
          {activeTab === "hardware" && (
            <div className="space-y-6 rounded-2xl border border-probe-border bg-probe-surface p-6 text-xs sm:text-sm text-probe-ink">
              <h2 className="text-lg font-semibold text-probe-accent">
                Hardware Setup Guide for Direct RF &amp; Microwave Tracking
              </h2>
              <p className="text-probe-muted leading-relaxed">
                While consumer smartphone microphones can capture demodulated baseband audio envelopes (100 Hz – 24 kHz),
                direct identification of the raw gigahertz carrier frequency ($f_c$) and transmitter RF-DNA requires dedicated
                electronic warfare and signals intelligence hardware.
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-probe-border bg-probe-bg p-4 space-y-2">
                  <h3 className="font-semibold text-emerald-400 uppercase tracking-wider text-xs">
                    Software Defined Radio (SDR)
                  </h3>
                  <p className="text-probe-muted">
                    • <strong>HackRF One / RTL-SDR v4</strong>: Tunes from 1 MHz to 6 GHz. Connect to open-source software
                    like GQRX, SDRangel, or GNU Radio to monitor radar and pulsed microwave bands.
                  </p>
                  <p className="text-probe-muted">
                    • <strong>KrakenSDR (5-channel coherent receiver)</strong>: Allows automated real-time phase-interferometry
                    Angle of Arrival (AoA) bearing calculation directly on a live map.
                  </p>
                </div>

                <div className="rounded-xl border border-probe-border bg-probe-bg p-4 space-y-2">
                  <h3 className="font-semibold text-amber-400 uppercase tracking-wider text-xs">
                    Directional Antennas
                  </h3>
                  <p className="text-probe-muted">
                    • <strong>Log-Periodic Dipole Array (LPDA)</strong>: 800 MHz – 6 GHz coverage with ~6–10 dBi directional gain.
                    Sweeping 360° isolates the bearing vector facing the transmitter.
                  </p>
                  <p className="text-probe-muted">
                    • <strong>Parabolic Grid / Horn Antenna</strong>: Narrow 15° beamwidth provides high angular resolution
                    to identify which external window or vehicle contains the emitter.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-probe-border bg-probe-surface2 p-4 text-xs">
                <h4 className="font-semibold text-probe-accent">Related Patents &amp; Legal Framework:</h4>
                <p className="mt-1 text-probe-muted">
                  Review <Link href="/patents" className="text-probe-accent underline">US Patent 10,816,680</Link> (Wearable Pulse RF Dosimeters)
                  and the <Link href="/charter" className="text-probe-accent underline">NeuraGuard Charter</Link> on Physical &amp; Directed-Energy Integrity.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
