"use client";

import Link from "next/link";
import { useMemo } from "react";
import { decodeCharterPayload } from "@/lib/guard/share";
import { CharterReadOnly } from "./CharterReadOnly";

export function CharterShareView({ payload }: { payload: string }) {
  const charter = useMemo(() => decodeCharterPayload(payload), [payload]);

  if (!charter) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold text-guard-ink">Link couldn&apos;t be decoded</h1>
        <p className="mt-3 text-sm text-guard-muted">
          This charter link looks corrupted or was created by a different app version. Nothing was sent to
          any server — decoding happens entirely in your browser.
        </p>
        <Link href="/charter" className="mt-6 inline-block text-sm font-medium text-guard-accent underline">
          Build your own charter →
        </Link>
      </div>
    );
  }

  return <CharterReadOnly charter={charter} />;
}
