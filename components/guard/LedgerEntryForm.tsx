"use client";

import { useState } from "react";
import type { AccessType, LedgerStatus } from "@/lib/guard/types";
import { ACCESS_TYPE_LABEL, STATUS_LABEL } from "@/lib/guard/ledger";

export interface LedgerFormValues {
  name: string;
  accessType: AccessType;
  purpose: string;
  status: LedgerStatus;
  notes?: string;
}

const ACCESS_TYPES: AccessType[] = ["read", "write", "stimulate", "infer"];
const STATUSES: LedgerStatus[] = ["granted", "denied", "revoked"];

export function LedgerEntryForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: LedgerFormValues;
  onSubmit: (values: LedgerFormValues) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<LedgerFormValues>(
    initial ?? { name: "", accessType: "read", purpose: "", status: "granted", notes: "" }
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!values.name.trim()) return;
        onSubmit(values);
      }}
      className="card-guard grid grid-cols-1 gap-3 rounded-2xl p-4 sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-guard-muted">
          Device / app name
        </label>
        <input
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
          placeholder="e.g. Calm Focus Headband"
          required
          className="w-full rounded-lg border border-guard-border bg-black/20 p-2.5 text-sm text-guard-ink placeholder:text-guard-muted/50 focus:border-guard-accent focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-guard-muted">
          Access type
        </label>
        <select
          value={values.accessType}
          onChange={(e) => setValues({ ...values, accessType: e.target.value as AccessType })}
          className="w-full rounded-lg border border-guard-border bg-black/20 p-2.5 text-sm text-guard-ink focus:border-guard-accent focus:outline-none"
        >
          {ACCESS_TYPES.map((t) => (
            <option key={t} value={t}>
              {ACCESS_TYPE_LABEL[t]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-guard-muted">Status</label>
        <select
          value={values.status}
          onChange={(e) => setValues({ ...values, status: e.target.value as LedgerStatus })}
          className="w-full rounded-lg border border-guard-border bg-black/20 p-2.5 text-sm text-guard-ink focus:border-guard-accent focus:outline-none"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-guard-muted">Purpose</label>
        <input
          value={values.purpose}
          onChange={(e) => setValues({ ...values, purpose: e.target.value })}
          placeholder="e.g. Continuous focus scoring for productivity dashboard"
          className="w-full rounded-lg border border-guard-border bg-black/20 p-2.5 text-sm text-guard-ink placeholder:text-guard-muted/50 focus:border-guard-accent focus:outline-none"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-guard-muted">
          Notes (optional)
        </label>
        <input
          value={values.notes ?? ""}
          onChange={(e) => setValues({ ...values, notes: e.target.value })}
          className="w-full rounded-lg border border-guard-border bg-black/20 p-2.5 text-sm text-guard-ink focus:border-guard-accent focus:outline-none"
        />
      </div>

      <div className="flex gap-3 sm:col-span-2">
        <button type="submit" className="rounded-lg bg-guard-accent px-4 py-2 text-sm font-semibold text-guard-bg">
          Save entry
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-guard-border px-4 py-2 text-sm font-medium text-guard-muted hover:text-guard-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
