// Copies pdfjs-dist's worker build into /public so it can be served as a
// plain static asset (avoids webpack ESM/worker resolution issues with
// `new URL(..., import.meta.url)` inside Next.js's build).
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const src = join(root, "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs");
const destDir = join(root, "public");
const dest = join(destDir, "pdf.worker.min.mjs");

if (!existsSync(src)) {
  console.warn("[copy-pdf-worker] pdfjs-dist worker not found, skipping:", src);
  process.exit(0);
}

if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log("[copy-pdf-worker] copied pdf.worker.min.mjs to /public");
