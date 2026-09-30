"use client";

import { useState } from "react";
import clsx from "@/lib/clsx";
import type { Scenario, ScenarioChoice } from "@/lib/guard/types";
import { ACCESS_TYPE_LABEL } from "@/lib/guard/ledger";
import { pillarDef } from "@/lib/guard/charter";

const CHOICES: { id: ScenarioChoice; label: string; style: string }[] = [
  { id: "allow", label: "Allow", style: "hover:border-emerald-400/60 hover:text-emerald-300" },
  { id: "allow-once", label: "Allow once", style: "hover:border-sky-400/60 hover:text-sky-300" },
  { id: "deny", label: "Deny", style: "hover:border-rose-400/60 hover:text-rose-300" },
];

export function ScenarioCard({
  scenario,
  onLogChoice,
}: {
  scenario: Scenario;
  onLogChoice: (scenario: Scenario, choice: ScenarioChoice) => void;
}) {
  const [choice, setChoice] = useState<ScenarioChoice | null>(null);
  const [logged, setLogged] = useState(false);
  const pillar = pillarDef(scenario.pillarId);

  return (
    <div className="card-guard animate-fade-up rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-black/30 px-2.5 py-1 text-xs font-medium text-guard-muted">
          {ACCESS_TYPE_LABEL[scenario.accessType]} request
        </span>
        <span className="rounded-full bg-guard-accent/10 px-2.5 py-1 text-xs font-medium text-guard-accent">
          {pillar.shortTitle}
        </span>
      </div>

      <h3 className="mt-3 text-lg font-semibold text-guard-ink">{scenario.title}</h3>
      <p className="mt-1 text-sm font-medium text-guard-muted">{scenario.requester}</p>
      <p className="mt-3 text-sm leading-relaxed text-guard-muted/90">{scenario.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {CHOICES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              setChoice(c.id);
              setLogged(false);
            }}
            className={clsx(
              "rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors",
              choice === c.id
                ? "border-guard-accent bg-guard-accent text-guard-bg"
                : clsx("border-guard-border text-guard-ink", c.style)
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {choice && (
        <div className="mt-4 rounded-lg border border-guard-border bg-black/25 p-3.5">
          <p className="text-sm text-guard-ink/90">{scenario.consequences[toKey(choice)]}</p>
          <button
            type="button"
            disabled={logged}
            onClick={() => {
              onLogChoice(scenario, choice);
              setLogged(true);
            }}
            className="mt-3 text-xs font-semibold text-guard-accent hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            {logged ? "✓ Logged to your consent ledger" : "Log this decision to my ledger →"}
          </button>
        </div>
      )}
    </div>
  );
}

function toKey(choice: ScenarioChoice): "allow" | "allowOnce" | "deny" {
  if (choice === "allow-once") return "allowOnce";
  return choice;
}
