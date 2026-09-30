"use client";

import { useEffect, useRef, useState } from "react";
import { BleHrClient, isWebBluetoothSupported } from "@/lib/probe/ble";
import type { BleHrReading, BleSupportState } from "@/lib/probe/types";

export function BlePanel({
  active,
  onReading,
}: {
  active: boolean;
  onReading?: (reading: BleHrReading) => void;
}) {
  const client = useRef<BleHrClient | null>(null);
  const [state, setState] = useState<BleSupportState>(isWebBluetoothSupported() ? "idle" : "unsupported");
  const [reading, setReading] = useState<BleHrReading | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);

  useEffect(() => {
    return () => client.current?.disconnect();
  }, []);

  async function connect() {
    const c = new BleHrClient({
      onReading: (r) => {
        setReading(r);
        onReading?.(r);
      },
      onStateChange: setState,
      onDisconnected: () => setDeviceName(null),
    });
    client.current = c;
    try {
      await c.connect();
      setDeviceName(c.deviceName);
    } catch {
      // onStateChange already reflects the error state; requestDevice
      // rejects if the user cancels the browser picker, which is not an
      // application error.
    }
  }

  function disconnect() {
    client.current?.disconnect();
    client.current = null;
    setDeviceName(null);
    setReading(null);
    setState("idle");
  }

  return (
    <div className="card-probe rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-probe-accent">
          Bluetooth heart rate (optional)
        </h3>
        {state === "connected" ? (
          <button
            type="button"
            onClick={disconnect}
            className="rounded-md border border-probe-border px-3 py-1.5 text-xs font-medium text-probe-ink hover:border-probe-accent"
          >
            Disconnect
          </button>
        ) : (
          <button
            type="button"
            disabled={!active || state === "unsupported" || state === "connecting"}
            onClick={connect}
            className="rounded-md border border-probe-border px-3 py-1.5 text-xs font-medium text-probe-ink transition-colors hover:border-probe-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            {state === "connecting" ? "Connecting…" : "Connect device"}
          </button>
        )}
      </div>

      {!active && (
        <p className="mt-2 text-xs text-probe-muted">Enable the Bluetooth channel on the consent gate to use this.</p>
      )}
      {state === "unsupported" && (
        <p className="mt-2 text-xs text-rose-300">
          Web Bluetooth isn&apos;t supported in this browser (all of iOS Safari, and most non-Chromium
          desktop browsers). This channel is a graceful no-op here.
        </p>
      )}
      {state === "error" && <p className="mt-2 text-xs text-rose-300">Couldn&apos;t connect to that device.</p>}

      <div className="mt-4">
        <p className="text-3xl font-bold tabular-nums text-probe-ink">
          {reading?.bpm ?? "—"} <span className="text-sm font-normal text-probe-muted">bpm</span>
        </p>
        <p className="mt-0.5 text-xs text-probe-muted">
          {deviceName ? `Connected: ${deviceName}` : "No device connected"}
        </p>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-probe-muted/70">
        Connects to a standard Bluetooth Heart Rate Service (0x180D) peripheral, e.g. a chest strap. Falls
        back to camera PPG if unavailable.
      </p>
    </div>
  );
}
