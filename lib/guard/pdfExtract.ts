// Client-only PDF text extraction using pdfjs-dist. Everything runs in the
// browser — the PDF bytes never leave the device.
export async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  // Served as a static asset from /public (copied from node_modules at
  // install time — see package.json's "postinstall" script) rather than
  // bundled via `new URL(..., import.meta.url)`, which Next.js's webpack
  // config doesn't resolve cleanly for this package's worker build.
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pageTexts: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
    pageTexts.push(text);
  }
  return pageTexts.join("\n\n").trim();
}
