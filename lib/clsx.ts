// Tiny classnames joiner so we don't need an extra dependency.
export type ClassValue = string | number | null | undefined | false | Record<string, boolean>;

export default function clsx(...args: ClassValue[]): string {
  const out: string[] = [];
  for (const arg of args) {
    if (!arg) continue;
    if (typeof arg === "string" || typeof arg === "number") {
      out.push(String(arg));
    } else if (typeof arg === "object") {
      for (const [key, value] of Object.entries(arg)) {
        if (value) out.push(key);
      }
    }
  }
  return out.join(" ");
}
