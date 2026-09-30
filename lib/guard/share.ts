import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import type { Charter } from "./types";

/** Encode a charter into a compact, URL-safe payload for the /c/[payload] route.
 * Everything happens client-side — no backend involved. */
export function encodeCharterPayload(charter: Charter): string {
  return compressToEncodedURIComponent(JSON.stringify(charter));
}

export function decodeCharterPayload(payload: string): Charter | null {
  try {
    const json = decompressFromEncodedURIComponent(payload);
    if (!json) return null;
    const parsed = JSON.parse(json) as Charter;
    if (parsed.schema !== "neuraguard.charter.v1") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildShareUrl(charter: Charter): string {
  const payload = encodeCharterPayload(charter);
  if (typeof window === "undefined") return `/c/${payload}`;
  return `${window.location.origin}/c/${payload}`;
}
