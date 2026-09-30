"use client";

import { useRef, useState } from "react";
import { saveUpload } from "@/lib/guard/storage";
import { extractPdfText } from "@/lib/guard/pdfExtract";

type Status = "idle" | "extracting" | "ready" | "saving" | "error";

function isTextLike(file: File): boolean {
  return file.type === "text/plain" || file.type === "text/markdown" || /\.(txt|md)$/i.test(file.name);
}

function isPdf(file: File): boolean {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

function isImage(file: File): boolean {
  return file.type.startsWith("image/");
}

export function UploadPanel({ onSaved }: { onSaved: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(selected: File) {
    setFile(selected);
    setCaption("");
    setError(null);

    if (isTextLike(selected)) {
      setStatus("extracting");
      try {
        const content = await selected.text();
        setText(content);
        setStatus("ready");
      } catch {
        setError("Couldn't read that text file.");
        setStatus("error");
      }
    } else if (isPdf(selected)) {
      setStatus("extracting");
      try {
        const content = await extractPdfText(selected);
        setText(content || "");
        setStatus("ready");
      } catch {
        setError("Couldn't extract text from that PDF. You can still save it and add a caption below.");
        setText("");
        setStatus("ready");
      }
    } else if (isImage(selected)) {
      setText("");
      setStatus("ready");
    } else {
      setError("Unsupported file type. Please choose an image, PDF, .txt, or .md file.");
      setStatus("error");
    }
  }

  async function handleSave() {
    if (!file) return;
    setStatus("saving");
    try {
      await saveUpload({
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        extractedText: text || caption,
        caption: caption || undefined,
        blob: file,
      });
      setFile(null);
      setText("");
      setCaption("");
      setStatus("idle");
      if (inputRef.current) inputRef.current.value = "";
      onSaved();
    } catch {
      setError("Couldn't save this upload to your device's storage.");
      setStatus("error");
    }
  }

  return (
    <div className="card-guard rounded-2xl p-5 sm:p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-guard-accent">Scan your own document</h3>
      <p className="mt-1.5 text-sm text-guard-muted">
        On your phone: take a photo of a consent form, or choose a PDF/text file. Everything is processed and
        stored on this device only — nothing is uploaded anywhere.
      </p>

      <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-guard-border bg-black/15 px-4 py-8 text-center transition-colors hover:border-guard-accent">
        <span className="text-2xl">📄</span>
        <span className="text-sm font-medium text-guard-ink">Take photo / Choose file</span>
        <span className="text-xs text-guard-muted">Image, PDF, .txt, or .md</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf,.txt,.md"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected) handleFile(selected);
          }}
        />
      </label>

      {file && (
        <div className="mt-4 rounded-lg border border-guard-border bg-black/20 p-3.5">
          <p className="text-sm font-medium text-guard-ink">
            {file.name} <span className="text-guard-muted">({Math.round(file.size / 1024)} KB)</span>
          </p>

          {status === "extracting" && <p className="mt-2 text-xs text-guard-muted">Extracting text…</p>}

          {status === "ready" && isImage(file) && (
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-guard-muted">
                Caption / transcribed text (no OCR — type or paste what it says)
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                placeholder="e.g. 'Section 4: we may share biometric data with affiliates...'"
                className="w-full resize-none rounded-lg border border-guard-border bg-black/20 p-2.5 text-sm text-guard-ink placeholder:text-guard-muted/50 focus:border-guard-accent focus:outline-none"
              />
            </div>
          )}

          {status === "ready" && !isImage(file) && (
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-guard-muted">
                Extracted text (editable)
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                className="w-full resize-none rounded-lg border border-guard-border bg-black/20 p-2.5 text-xs text-guard-ink focus:border-guard-accent focus:outline-none"
              />
            </div>
          )}

          {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}

          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={status === "saving" || status === "extracting"}
              className="rounded-lg bg-guard-accent px-3.5 py-2 text-xs font-semibold text-guard-bg disabled:opacity-50"
            >
              {status === "saving" ? "Saving…" : "Save to my uploads"}
            </button>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setText("");
                setCaption("");
                setStatus("idle");
                setError(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="rounded-lg border border-guard-border px-3.5 py-2 text-xs font-medium text-guard-muted hover:text-guard-ink"
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
