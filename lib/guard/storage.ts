// Small IndexedDB helper for storing uploaded consent-form documents
// (blob + extracted text + metadata) entirely on-device. No network calls.
import type { UploadRecord } from "./types";

const DB_NAME = "neuraguard-uploads";
const DB_VERSION = 1;
const STORE_NAME = "uploads";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this environment."));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Failed to open IndexedDB."));
  });
}

function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `upload-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function saveUpload(input: Omit<UploadRecord, "id" | "createdAt">): Promise<UploadRecord> {
  const db = await openDb();
  const record: UploadRecord = {
    ...input,
    id: genId(),
    createdAt: new Date().toISOString(),
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Failed to save upload."));
  });
  db.close();
  return record;
}

export async function listUploads(): Promise<UploadRecord[]> {
  const db = await openDb();
  const records = await new Promise<UploadRecord[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result as UploadRecord[]);
    req.onerror = () => reject(req.error ?? new Error("Failed to list uploads."));
  });
  db.close();
  return records.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getUpload(id: string): Promise<UploadRecord | undefined> {
  const db = await openDb();
  const record = await new Promise<UploadRecord | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => resolve(req.result as UploadRecord | undefined);
    req.onerror = () => reject(req.error ?? new Error("Failed to load upload."));
  });
  db.close();
  return record;
}

export async function deleteUpload(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Failed to delete upload."));
  });
  db.close();
}

export async function updateUploadCaption(id: string, caption: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => {
      const record = req.result as UploadRecord | undefined;
      if (record) {
        record.caption = caption;
        record.extractedText = record.extractedText || caption;
        store.put(record);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Failed to update upload."));
  });
  db.close();
}
