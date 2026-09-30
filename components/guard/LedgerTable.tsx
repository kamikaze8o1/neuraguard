"use client";

import clsx from "@/lib/clsx";
import type { LedgerEntry } from "@/lib/guard/types";
import { ACCESS_TYPE_LABEL, STATUS_LABEL } from "@/lib/guard/ledger";

const STATUS_STYLE: Record<LedgerEntry["status"], string> = {
  granted: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  denied: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  revoked: "bg-rose-500/10 text-rose-300 border-rose-500/30",
};

export function LedgerTable({
  entries,
  onEdit,
  onDelete,
}: {
  entries: LedgerEntry[];
  onEdit: (entry: LedgerEntry) => void;
  onDelete: (id: string) => void;
}) {
  if (entries.length === 0) {
    return (
      <div className="card-guard rounded-2xl p-10 text-center text-sm text-guard-muted">
        No entries yet. Add your first device or app access grant above.
      </div>
    );
  }

  return (
    <div className="card-guard overflow-hidden rounded-2xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-guard-border bg-black/20 text-xs uppercase tracking-wide text-guard-muted">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Access</th>
              <th className="px-4 py-3">Purpose</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-guard-border/60 last:border-0">
                <td className="px-4 py-3 font-medium text-guard-ink">{entry.name}</td>
                <td className="px-4 py-3 text-guard-muted">{ACCESS_TYPE_LABEL[entry.accessType]}</td>
                <td className="max-w-[220px] truncate px-4 py-3 text-guard-muted" title={entry.purpose}>
                  {entry.purpose || "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={clsx(
                      "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
                      STATUS_STYLE[entry.status]
                    )}
                  >
                    {STATUS_LABEL[entry.status]}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-guard-muted">
                  {new Date(entry.timestamp).toLocaleDateString()}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <button
                    onClick={() => onEdit(entry)}
                    className="mr-3 text-xs font-medium text-guard-accent hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(entry.id)}
                    className="text-xs font-medium text-rose-300 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
