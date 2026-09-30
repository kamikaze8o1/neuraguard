"use client";

import { useEffect, useState } from "react";
import { SCENARIOS } from "@/lib/guard/scenarios";
import type { LedgerEntry, Scenario, ScenarioChoice } from "@/lib/guard/types";
import { addLedgerEntry, loadLedger, saveLedger } from "@/lib/guard/ledger";
import { ScenarioCard } from "@/components/guard/ScenarioCard";

const CHOICE_TO_STATUS: Record<ScenarioChoice, "granted" | "denied"> = {
  allow: "granted",
  "allow-once": "granted",
  deny: "denied",
};

export default function LabPage() {
  const [entries, setEntries] = useState<LedgerEntry[] | null>(null);
  const [lastLogged, setLastLogged] = useState<string | null>(null);

  useEffect(() => {
    setEntries(loadLedger());
  }, []);

  function handleLogChoice(scenario: Scenario, choice: ScenarioChoice) {
    setEntries((prev) => {
      const base = prev ?? [];
      const next = addLedgerEntry(base, {
        name: scenario.requester,
        accessType: scenario.accessType,
        purpose: scenario.title + (choice === "allow-once" ? " (one-time)" : ""),
        status: CHOICE_TO_STATUS[choice],
        notes: `Logged from Permission Lab · choice: ${choice}`,
      });
      saveLedger(next);
      return next;
    });
    setLastLogged(scenario.title);
  }

  return (
    <div className="bg-guard-gradient min-h-full">
      <div className="mx-auto max-w-4xl px-4 pb-24 pt-10 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-guard-accent">Permission Lab</p>
        <h1 className="mt-1 text-3xl font-semibold text-guard-ink sm:text-4xl">Practice saying no (or yes)</h1>
        <p className="mt-2 max-w-xl text-sm text-guard-muted">
          Scripted BCI access requests you might actually see. Choose Allow, Allow once, or Deny and see the
          plain-language consequence — then optionally log the decision to your consent ledger.
        </p>

        {lastLogged && (
          <p className="mt-4 rounded-lg border border-guard-accent/30 bg-guard-accent/10 px-3 py-2 text-sm text-guard-accent">
            Logged “{lastLogged}” to your ledger. View it on the{" "}
            <a href="/ledger" className="underline">
              Ledger page
            </a>
            .
          </p>
        )}

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {SCENARIOS.map((scenario) => (
            <ScenarioCard key={scenario.id} scenario={scenario} onLogChoice={handleLogChoice} />
          ))}
        </div>
      </div>
    </div>
  );
}
