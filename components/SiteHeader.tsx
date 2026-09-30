"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "@/lib/clsx";

const GUARD_LINKS = [
  { href: "/charter", label: "Charter" },
  { href: "/ledger", label: "Ledger" },
  { href: "/lab", label: "Permission Lab" },
  { href: "/decode", label: "Decoder" },
  { href: "/patents", label: "Patents & Physics" },
];

const PROBE_LINKS = [
  { href: "/probe", label: "Consent Gate" },
  { href: "/probe/live", label: "Live Fusion" },
  { href: "/probe/incident", label: "Incident Monitor" },
  { href: "/probe/triangulate", label: "Triangulation" },
  { href: "/probe/aep", label: "AEP Session" },
];

function useSide(pathname: string): "guard" | "probe" | "home" {
  if (pathname.startsWith("/probe")) return "probe";
  if (pathname === "/") return "home";
  if (pathname.startsWith("/c/")) return "guard";
  return "guard";
}

export function SiteHeader() {
  const pathname = usePathname();
  const side = useSide(pathname);

  return (
    <header
      className={clsx(
        "sticky top-0 z-40 border-b backdrop-blur-md",
        side === "probe" ? "border-probe-border bg-probe-bg/85" : "border-guard-border bg-guard-bg/85"
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <span
              className={clsx(
                "inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold",
                side === "probe" ? "bg-probe-accent text-probe-bg" : "bg-guard-accent text-guard-bg"
              )}
            >
              NG
            </span>
            <span className="hidden sm:inline">
              Neura<span className={side === "probe" ? "text-probe-accent" : "text-guard-accent"}>Guard</span>
              <span className="mx-1.5 opacity-40">/</span>
              Neura<span className={side === "probe" ? "text-probe-accent" : "text-guard-accent"}>Probe</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 rounded-full border border-white/10 bg-black/20 p-1 text-xs font-medium">
            <Link
              href="/charter"
              className={clsx(
                "rounded-full px-3 py-1.5 transition-colors",
                side === "guard" ? "bg-guard-accent text-guard-bg" : "text-guard-muted hover:text-guard-ink"
              )}
            >
              Guard
            </Link>
            <Link
              href="/probe"
              className={clsx(
                "rounded-full px-3 py-1.5 transition-colors",
                side === "probe" ? "bg-probe-accent text-probe-bg" : "text-probe-muted hover:text-probe-ink"
              )}
            >
              Probe
            </Link>
          </nav>
        </div>

        {side !== "home" && (
          <nav className="flex flex-wrap gap-1 text-[13px]">
            {(side === "probe" ? PROBE_LINKS : GUARD_LINKS).map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    "rounded-md px-2.5 py-1 transition-colors",
                    active
                      ? side === "probe"
                        ? "bg-probe-surface2 text-probe-ink"
                        : "bg-guard-surface2 text-guard-ink"
                      : side === "probe"
                        ? "text-probe-muted hover:bg-probe-surface2/60 hover:text-probe-ink"
                        : "text-guard-muted hover:bg-guard-surface2/60 hover:text-guard-ink"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
