"use client";

import { useEffect, useRef, useState } from "react";
import type { LedgerEntry } from "@/lib/guard/types";
import {
  addLedgerEntry,
  downloadLedger,
  loadLedger,
  parseImportedLedger,
  removeLedgerEntry,
  revokeAll,
  saveLedger,
  updateLedgerEntry,
} from "@/lib/guard/ledger";
import { LedgerEntryForm, type LedgerFormValues } from "@/components/guard/LedgerEntryForm";
import { LedgerTable } from "@/components/guard/LedgerTable";

export default function LedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEntries(loadLedger());
  }, []);

  useEffect(() => {
    if (entries) saveLedger(entries);
  }, [entries]);

  if (!entries) {
    return <div className="px-6 py-16 text-center text-guard-muted">Loading your ledger…</div>;
  }

  const editingEntry = editingId ? entries.find((e) => e.id === editingId) ?? null : null;
  const grantedCount = entries.filter((e) => e.status === "granted").length;

  function handleSubmit(values: LedgerFormValues) {
    const current = entries ?? [];
    if (editingEntry) {
      setEntries(updateLedgerEntry(current, editingEntry.id, values));
    } else {
      setEntries(addLedgerEntry(current, values));
    }
    setShowForm(false);
    setEditingId(null);
  }

  return (
    <div className="bg-guard-gradient min-h-full">
      <div className="mx-auto max-w-4xl px-4 pb-24 pt-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-guard-accent">Consent Ledger</p>
            <h1 className="mt-1 text-3xl font-semibold text-guard-ink sm:text-4xl">Who has neural access</h1>
            <p className="mt-2 max-w-xl text-sm text-guard-muted">
              Every device or app grant lives here, stored only on this device. {grantedCount} of {entries.length}{" "}
              entries currently granted.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setShowForm(true);
            }}
            className="rounded-lg bg-guard-accent px-4 py-2 text-sm font-semibold text-guard-bg"
          >
            + Add entry
          </button>
          <button
            type="button"
            onClick={() => {
              if (grantedCount === 0) return;
              if (confirm(`Revoke all ${grantedCount} currently granted entries?`)) {
                setEntries(revokeAll(entries));
              }
            }}
            disabled={grantedCount === 0}
            className="rounded-lg border border-rose-500/40 px-4 py-2 text-sm font-semibold text-rose-300 transition-colors hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ⛔ Revoke all neural access
          </button>
          <button
            type="button"
            onClick={() => downloadLedger(entries)}
            className="rounded-lg border border-guard-border px-4 py-2 text-sm font-medium text-guard-muted hover:text-guard-ink"
          >
            ⬇ Export JSON
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-guard-border px-4 py-2 text-sm font-medium text-guard-muted hover:text-guard-ink"
          >
            ⬆ Import JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              try {
                const text = await file.text();
                const imported = parseImportedLedger(text);
                setEntries(imported);
                setImportError(null);
              } catch {
                setImportError("That file doesn't look like a valid NeuraGuard ledger export.");
              }
            }}
          />
        </div>

        {importError && <p className="mt-3 text-sm text-rose-300">{importError}</p>}

        {showForm && (
          <div className="mt-6">
            <LedgerEntryForm
              initial={editingEntry ?? undefined}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            />
          </div>
        )}

        <div className="mt-8">
          <LedgerTable
            entries={entries}
            onEdit={(entry) => {
              setEditingId(entry.id);
              setShowForm(true);
            }}
            onDelete={(id) => {
              if (confirm("Delete this ledger entry?")) setEntries(removeLedgerEntry(entries, id));
            }}
          />
        </div>
      </div>
    </div>
  );
}
