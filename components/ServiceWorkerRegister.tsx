"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline shell is a progressive enhancement — ignore registration
      // failures (e.g. running over plain http in dev tooling).
    });
  }, []);

  return null;
}
