"use client";

import { useEffect, useState } from "react";
import clsx from "@/lib/clsx";
import { DECODE_TEMPLATES, heuristicDecodeFromText } from "@/lib/guard/decodeTemplates";
import type { DecodeTemplate, UploadRecord } from "@/lib/guard/types";
import { deleteUpload, listUploads } from "@/lib/guard/storage";
import { DecodeView } from "@/components/guard/DecodeView";
import { UploadPanel } from "@/components/guard/UploadPanel";

type Tab = "templates" | "uploads";

export default function DecodePage() {
  const [tab, setTab] = useState<Tab>("templates");
  const [selectedTemplate, setSelectedTemplate] = useState<DecodeTemplate>(DECODE_TEMPLATES[0]);
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [selectedUploadId, setSelectedUploadId] = useState<string | null>(null);
  const [loadingUploads, setLoadingUploads] = useState(true);

  async function refreshUploads() {
    setLoadingUploads(true);
    try {
      const records = await listUploads();
      setUploads(records);
    } catch {
      setUploads([]);
    } finally {
      setLoadingUploads(false);
    }
  }

  useEffect(() => {
    refreshUploads();
  }, []);

  const selectedUpload = uploads.find((u) => u.id === selectedUploadId) ?? null;
  const uploadDecode = selectedUpload
    ? heuristicDecodeFromText(selectedUpload.extractedText || selectedUpload.caption || "", selectedUpload.name)
    : null;

  return (
    <div className="bg-guard-gradient min-h-full">
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-10 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-guard-accent">Policy Decoder</p>
        <h1 className="mt-1 text-3xl font-semibold text-guard-ink sm:text-4xl">Plain language, not fine print</h1>
        <p className="mt-2 max-w-xl text-sm text-guard-muted">
          Curated templates for common device categories, or scan your own consent form from your phone.
        </p>

        <div className="mt-6 inline-flex rounded-full border border-guard-border bg-black/20 p-1 text-sm">
          {(["templates", "uploads"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                "rounded-full px-4 py-1.5 font-medium transition-colors",
                tab === t ? "bg-guard-accent text-guard-bg" : "text-guard-muted hover:text-guard-ink"
              )}
            >
              {t === "templates" ? "Templates" : `My uploads (${uploads.length})`}
            </button>
          ))}
        </div>

        {tab === "templates" ? (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
            <div className="flex flex-col gap-2">
              {DECODE_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t)}
                  className={clsx(
                    "rounded-xl border p-3.5 text-left transition-colors",
                    selectedTemplate.id === t.id
                      ? "border-guard-accent bg-guard-surface2"
                      : "border-guard-border bg-guard-surface hover:border-guard-accent/50"
                  )}
                >
                  <span className="block text-sm font-semibold text-guard-ink">{t.title}</span>
                  <span className="mt-0.5 block text-xs text-guard-muted">{t.subtitle}</span>
                </button>
              ))}
            </div>
            <DecodeView decode={selectedTemplate} />
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
            <div className="flex flex-col gap-4">
              <UploadPanel onSaved={refreshUploads} />

              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-guard-muted">
                  Upload history
                </h3>
                {loadingUploads && <p className="text-sm text-guard-muted">Loading…</p>}
                {!loadingUploads && uploads.length === 0 && (
                  <p className="text-sm text-guard-muted">No uploads yet.</p>
                )}
                {uploads.map((u) => (
                  <div
                    key={u.id}
                    className={clsx(
                      "flex items-center justify-between rounded-lg border p-3 text-left transition-colors",
                      selectedUploadId === u.id
                        ? "border-guard-accent bg-guard-surface2"
                        : "border-guard-border bg-guard-surface hover:border-guard-accent/50"
                    )}
                  >
                    <button onClick={() => setSelectedUploadId(u.id)} className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-sm font-medium text-guard-ink">{u.name}</span>
                      <span className="block text-xs text-guard-muted">
                        {new Date(u.createdAt).toLocaleDateString()} · {Math.round(u.size / 1024)} KB
                      </span>
                    </button>
                    <button
                      onClick={async () => {
                        await deleteUpload(u.id);
                        if (selectedUploadId === u.id) setSelectedUploadId(null);
                        refreshUploads();
                      }}
                      className="ml-2 shrink-0 text-xs font-medium text-rose-300 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {uploadDecode ? (
              <DecodeView decode={uploadDecode} />
            ) : (
              <div className="card-guard flex items-center justify-center rounded-2xl p-10 text-center text-sm text-guard-muted">
                Select an upload on the left to see its plain-language decode.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
