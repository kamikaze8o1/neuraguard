import type { AccessType, LedgerEntry, LedgerStatus } from "./types";

export const LEDGER_STORAGE_KEY = "neuraguard.ledger.v1";

function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `ledger-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function loadLedger(): LedgerEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LEDGER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as LedgerEntry[];
  } catch {
    return [];
  }
}

export function saveLedger(entries: LedgerEntry[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(entries));
}

export interface NewLedgerEntryInput {
  name: string;
  accessType: AccessType;
  purpose: string;
  status: LedgerStatus;
  notes?: string;
}

export function addLedgerEntry(entries: LedgerEntry[], input: NewLedgerEntryInput): LedgerEntry[] {
  const entry: LedgerEntry = {
    id: genId(),
    name: input.name,
    accessType: input.accessType,
    purpose: input.purpose,
    status: input.status,
    notes: input.notes,
    timestamp: new Date().toISOString(),
  };
  return [entry, ...entries];
}

export function updateLedgerEntry(
  entries: LedgerEntry[],
  id: string,
  patch: Partial<Omit<LedgerEntry, "id">>
): LedgerEntry[] {
  return entries.map((e) => (e.id === id ? { ...e, ...patch, timestamp: new Date().toISOString() } : e));
}

export function removeLedgerEntry(entries: LedgerEntry[], id: string): LedgerEntry[] {
  return entries.filter((e) => e.id !== id);
}

export function revokeAll(entries: LedgerEntry[]): LedgerEntry[] {
  const now = new Date().toISOString();
  return entries.map((e) =>
    e.status === "granted" ? { ...e, status: "revoked" as LedgerStatus, timestamp: now } : e
  );
}

export function exportLedgerJson(entries: LedgerEntry[]): string {
  return JSON.stringify(
    { schema: "neuraguard.ledger.v1", exportedAt: new Date().toISOString(), entries },
    null,
    2
  );
}

export function downloadLedger(entries: LedgerEntry[]): void {
  const json = exportLedgerJson(entries);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `neuraguard-ledger-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function parseImportedLedger(raw: string): LedgerEntry[] {
  const parsed = JSON.parse(raw);
  const entries = Array.isArray(parsed) ? parsed : parsed.entries;
  if (!Array.isArray(entries)) throw new Error("File does not contain a recognizable ledger.");
  return entries.map((e) => ({
    id: typeof e.id === "string" ? e.id : genId(),
    name: String(e.name ?? "Unnamed entry"),
    accessType: (["read", "write", "stimulate", "infer"].includes(e.accessType)
      ? e.accessType
      : "read") as AccessType,
    purpose: String(e.purpose ?? ""),
    status: (["granted", "denied", "revoked"].includes(e.status) ? e.status : "granted") as LedgerStatus,
    timestamp: typeof e.timestamp === "string" ? e.timestamp : new Date().toISOString(),
    notes: typeof e.notes === "string" ? e.notes : undefined,
  }));
}

export const ACCESS_TYPE_LABEL: Record<AccessType, string> = {
  read: "Read",
  write: "Write",
  stimulate: "Stimulate",
  infer: "Infer",
};

export const STATUS_LABEL: Record<LedgerStatus, string> = {
  granted: "Granted",
  denied: "Denied",
  revoked: "Revoked",
};
