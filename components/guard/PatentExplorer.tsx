"use client";

import { useState } from "react";
import {
  PATENT_DATABASE,
  SCIENTIFIC_REPORTS,
  searchPatents,
  type PatentCategory,
  type PatentEntry,
  type PlausibilityTier,
} from "@/lib/guard/patents";
import clsx from "@/lib/clsx";

const CATEGORY_TABS: Array<{ id: PatentCategory | "all"; label: string }> = [
  { id: "all", label: "All Records" },
  { id: "microwave-auditory", label: "Frey Effect / RF Hearing" },
  { id: "ultrasonic-parametric", label: "Ultrasonic / Parametric" },
  { id: "directed-energy", label: "Directed Energy" },
  { id: "dosimetry-sensor", label: "Dosimeters & Sensors" },
];

function PlausibilityBadge({ tier }: { tier: PlausibilityTier }) {
  switch (tier) {
    case "proven-physics":
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/30">
          ● Proven Biophysics
        </span>
      );
    case "engineering-prototype":
      return (
        <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/30">
          ▲ Engineering Prototype
        </span>
      );
    case "speculative-concept":
      return (
        <span className="inline-flex items-center rounded-full bg-purple-500/15 px-2.5 py-0.5 text-xs font-medium text-purple-400 border border-purple-500/30">
          ◆ Speculative Concept
        </span>
      );
  }
}

export function PatentExplorer() {
  const [activeTab, setActiveTab] = useState<PatentCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>("us-4877027");
  const [showLiterature, setShowLiterature] = useState(false);

  const filteredPatents = searchPatents(searchQuery, activeTab);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-guard-border bg-guard-surface px-2.5 py-1 text-xs font-mono font-semibold uppercase tracking-wider text-guard-accent">
            Registry · Patents &amp; Biophysics
          </span>
          <span className="text-xs text-guard-muted">Havana Syndrome / Frey Effect / AHI</span>
        </div>
        <h1 className="text-3xl font-semibold text-guard-ink sm:text-4xl">
          Electromagnetic &amp; Acoustic Patent Registry
        </h1>
        <p className="max-w-3xl text-sm text-guard-muted">
          Exhaustive technical dossier of patents, declassified defense projects, and peer-reviewed
          mechanisms covering the <strong>Microwave Auditory Effect (Frey Effect)</strong>,
          <strong> acoustic heterodyning</strong>, and <strong>directed energy</strong> associated with
          Anomalous Health Incidents (AHIs).
        </p>
      </div>

      {/* Physics Quick Primer Banner */}
      <div className="mt-6 rounded-2xl border border-guard-accent/30 bg-guard-surface/80 p-5 shadow-glow">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-guard-accent">
              Core Physical Mechanism: The Frey Effect (Microwave Auditory Effect - MAE)
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-guard-ink/90 sm:text-sm">
              Discovered by Dr. Allan Frey (1961), high-peak pulsed RF/microwaves (200 MHz – 10 GHz) absorbed
              by water in the head cause instantaneous microsecond thermoelastic expansion (ΔT ≈ 10⁻⁶ °C).
              This launches an <strong>internal acoustic pressure shockwave</strong> that conducts via skull
              bone to the cochlea. Targets perceive clicks, buzzes, or chirps matching the pulse repetition
              rate—<strong>which earplugs cannot muffle</strong> because the sound originates within the head.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() => setShowLiterature(!showLiterature)}
            className="rounded-lg border border-guard-border bg-guard-surface2 px-3 py-1.5 font-medium text-guard-ink transition-colors hover:border-guard-accent hover:text-guard-accent"
          >
            {showLiterature ? "Hide Consensus Reports ↑" : "View NASEM & IEEE Consensus Reports ↓"}
          </button>
        </div>
      </div>

      {/* Literature Panel */}
      {showLiterature && (
        <div className="mt-4 space-y-3 rounded-2xl border border-guard-border bg-guard-surface p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-guard-accent">
            Official Scientific Consensus &amp; Landmark Studies
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {SCIENTIFIC_REPORTS.map((report) => (
              <div key={report.id} className="rounded-xl border border-guard-border/70 bg-guard-bg/60 p-4">
                <div className="text-xs font-semibold text-guard-accent">{report.authorOrOrg}</div>
                <div className="mt-1 text-[11px] text-guard-muted">{report.date}</div>
                <h4 className="mt-2 text-xs font-semibold text-guard-ink">{report.title}</h4>
                <p className="mt-2 text-xs text-guard-muted leading-relaxed">{report.keyConclusions}</p>
                <div className="mt-3 text-[11px] font-mono text-emerald-400">
                  Mechanism: {report.mechanismEvaluated}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Category Filter Controls */}
      <div className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by patent #, keyword, inventor, or physics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-guard-border bg-guard-surface px-4 py-2.5 text-sm text-guard-ink placeholder-guard-muted focus:border-guard-accent focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-guard-muted hover:text-guard-ink"
              >
                Clear
              </button>
            )}
          </div>
          <div className="text-xs text-guard-muted">
            Showing {filteredPatents.length} of {PATENT_DATABASE.length} patents
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-1 border-b border-guard-border pb-3 text-xs">
          {CATEGORY_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "rounded-lg px-3 py-1.5 transition-colors",
                  active
                    ? "bg-guard-accent text-guard-bg font-semibold"
                    : "text-guard-muted hover:bg-guard-surface2 hover:text-guard-ink"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Patent List */}
      <div className="mt-6 space-y-4">
        {filteredPatents.length === 0 ? (
          <div className="rounded-2xl border border-guard-border bg-guard-surface p-12 text-center text-guard-muted">
            No patents found matching &ldquo;{searchQuery}&rdquo;. Try another term.
          </div>
        ) : (
          filteredPatents.map((patent) => {
            const isExpanded = expandedId === patent.id;
            return (
              <article
                key={patent.id}
                className={clsx(
                  "overflow-hidden rounded-2xl border transition-all",
                  isExpanded
                    ? "border-guard-accent/60 bg-guard-surface shadow-glow"
                    : "border-guard-border bg-guard-surface/60 hover:border-guard-border/80"
                )}
              >
                {/* Header card banner */}
                <div
                  className="flex cursor-pointer flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between"
                  onClick={() => setExpandedId(isExpanded ? null : patent.id)}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-guard-accent">
                        {patent.patentNumber}
                      </span>
                      <span className="text-xs text-guard-muted">· {patent.issueDate}</span>
                      <PlausibilityBadge tier={patent.plausibility} />
                    </div>
                    <h3 className="text-base font-semibold text-guard-ink sm:text-lg">
                      {patent.title}
                    </h3>
                    <p className="text-xs text-guard-muted">
                      Assignee: <span className="text-guard-ink">{patent.assignee}</span> · Band:{" "}
                      <span className="font-mono text-guard-accent/80">{patent.frequencyBand}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-guard-accent">
                      {isExpanded ? "Collapse ▲" : "Inspect Physics ▼"}
                    </span>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-guard-border/80 bg-guard-surface2/40 p-5 text-sm space-y-4">
                    {/* Claimed Mechanism */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-guard-accent">
                        Claimed Technical Implementation
                      </h4>
                      <p className="mt-1 text-xs sm:text-sm text-guard-ink leading-relaxed">
                        {patent.claimedMechanism}
                      </p>
                    </div>

                    {/* Physical Principles */}
                    <div className="rounded-xl border border-guard-border/80 bg-guard-bg/70 p-4">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                        Underlying Physical Principles
                      </h4>
                      <p className="mt-1 text-xs sm:text-sm text-guard-ink/90 leading-relaxed">
                        {patent.physicalPrinciples}
                      </p>
                    </div>

                    {/* Havana Syndrome / AHI Relevance */}
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                        Havana Syndrome (AHI) Relevance
                      </h4>
                      <p className="mt-1 text-xs sm:text-sm text-guard-ink/90 leading-relaxed">
                        {patent.havanaSyndromeRelevance}
                      </p>
                    </div>

                    {/* Defensive Countermeasures */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-guard-accent">
                        Physical Countermeasures &amp; Shielding
                      </h4>
                      <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
                        {patent.countermeasures.map((cm, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2 rounded-lg border border-guard-border bg-guard-bg px-3 py-2 text-guard-ink"
                          >
                            <span className="text-guard-accent">🛡</span>
                            <span>{cm}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Citations & Link */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-guard-muted border-t border-guard-border/50">
                      <div>
                        {patent.citations.length > 0 && (
                          <span>Ref: {patent.citations[0]}</span>
                        )}
                      </div>
                      {patent.url && (
                        <a
                          href={patent.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-guard-accent underline hover:text-white"
                        >
                          View Official Patent on Google Patents ↗
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
