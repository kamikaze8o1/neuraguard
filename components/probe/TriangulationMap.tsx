"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  bearingDegFromNorth,
  generateHyperbolaPoints,
  PROPAGATION_SPEEDS,
  simulateArrivalTimes,
  solveAoA,
  solveTDoA,
  TRIANGULATION_PRESETS,
  type PropagationMedium,
  type SensorNode,
  type TriangulationResult,
} from "@/lib/probe/triangulation";
import clsx from "@/lib/clsx";

export function TriangulationMap() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("window-perimeter");
  const [medium, setMedium] = useState<PropagationMedium>("acoustic");
  const [sensors, setSensors] = useState<SensorNode[]>(TRIANGULATION_PRESETS[0].sensors);
  const [targetEmitter, setTargetEmitter] = useState<{ x: number; y: number }>(
    TRIANGULATION_PRESETS[0].simulatedEmitter
  );
  const [arrivalTimes, setArrivalTimes] = useState<number[]>([]);
  const [bearings, setBearings] = useState<number[]>([]);
  const [solution, setSolution] = useState<TriangulationResult | null>(null);
  const [aoaSolution, setAoaSolution] = useState<TriangulationResult | null>(null);

  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load preset
  function loadPreset(id: string) {
    const preset = TRIANGULATION_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setSelectedPresetId(id);
    setMedium(preset.medium);
    setSensors(preset.sensors);
    setTargetEmitter(preset.simulatedEmitter);
  }

  // Update arrival times and solve whenever sensors, emitter, or medium changes
  useEffect(() => {
    const times = simulateArrivalTimes(targetEmitter, sensors, medium);
    const nextBearings = sensors.map((s) => bearingDegFromNorth(s, targetEmitter));
    setArrivalTimes(times);
    setBearings(nextBearings);
    const result = solveTDoA(sensors, times, medium, { x: targetEmitter.x * 0.9, y: targetEmitter.y * 0.9 });
    setSolution(result);
    setAoaSolution(
      solveAoA(sensors.map((s, i) => ({ ...s, bearingDeg: nextBearings[i] })))
    );
  }, [sensors, targetEmitter, medium]);

  // Canvas coordinate transform
  // World space: meters, centered or offset depending on max range
  const maxRange = Math.max(
    30,
    Math.max(...sensors.map((s) => Math.hypot(s.x, s.y)), Math.hypot(targetEmitter.x, targetEmitter.y)) * 1.35
  );

  const worldToCanvas = useCallback(
    (x: number, y: number, width: number, height: number) => {
      const scale = (Math.min(width, height) * 0.42) / maxRange;
      const cx = width / 2;
      const cy = height / 2 + (maxRange > 40 ? height * 0.18 : 0);
      return {
        cx: cx + x * scale,
        cy: cy - y * scale,
        scale,
      };
    },
    [maxRange]
  );

  const canvasToWorld = useCallback(
    (screenX: number, screenY: number, width: number, height: number) => {
      const scale = (Math.min(width, height) * 0.42) / maxRange;
      const cx = width / 2;
      const cy = height / 2 + (maxRange > 40 ? height * 0.18 : 0);
      return {
        wx: (screenX - cx) / scale,
        wy: -(screenY - cy) / scale,
      };
    },
    [maxRange]
  );

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background
    ctx.fillStyle = "#0b0f14";
    ctx.fillRect(0, 0, width, height);

    // Grid lines (every 5m or 10m depending on range)
    const gridStep = maxRange > 40 ? 10 : 5;
    ctx.strokeStyle = "rgba(40, 52, 63, 0.45)";
    ctx.lineWidth = 1;

    for (let g = -Math.ceil(maxRange); g <= Math.ceil(maxRange); g += gridStep) {
      const p1 = worldToCanvas(g, -maxRange * 2, width, height);
      const p2 = worldToCanvas(g, maxRange * 2, width, height);
      ctx.beginPath();
      ctx.moveTo(p1.cx, p1.cy);
      ctx.lineTo(p2.cx, p2.cy);
      ctx.stroke();

      const p3 = worldToCanvas(-maxRange * 2, g, width, height);
      const p4 = worldToCanvas(maxRange * 2, g, width, height);
      ctx.beginPath();
      ctx.moveTo(p3.cx, p3.cy);
      ctx.lineTo(p4.cx, p4.cy);
      ctx.stroke();

      // Label coordinate axes
      if (g !== 0 && Math.abs(g) <= maxRange) {
        ctx.fillStyle = "rgba(147, 163, 179, 0.35)";
        ctx.font = "9px ui-monospace, monospace";
        const labelPos = worldToCanvas(g, 0, width, height);
        ctx.fillText(`${g}m`, labelPos.cx + 2, labelPos.cy + 10);
      }
    }

    // Origin cross
    const origin = worldToCanvas(0, 0, width, height);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.beginPath();
    ctx.moveTo(origin.cx - 8, origin.cy);
    ctx.lineTo(origin.cx + 8, origin.cy);
    ctx.moveTo(origin.cx, origin.cy - 8);
    ctx.lineTo(origin.cx, origin.cy + 8);
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fillText("(0,0)", origin.cx + 4, origin.cy - 4);

    // Draw TDoA Hyperbolic Curves between sensor pairs
    if (sensors.length >= 2 && arrivalTimes.length >= 2) {
      const c = PROPAGATION_SPEEDS[medium];
      ctx.lineWidth = 1.5;

      for (let i = 0; i < sensors.length - 1; i++) {
        const s1 = sensors[i];
        const s2 = sensors[i + 1];
        const deltaD = ((arrivalTimes[i + 1] - arrivalTimes[i]) / 1000) * c;

        const points = generateHyperbolaPoints(s1, s2, deltaD, maxRange * 1.5);
        if (points.length > 2) {
          ctx.strokeStyle = i === 0 ? "rgba(57, 255, 143, 0.45)" : "rgba(255, 176, 32, 0.45)";
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          const start = worldToCanvas(points[0].x, points[0].y, width, height);
          ctx.moveTo(start.cx, start.cy);
          for (let k = 1; k < points.length; k++) {
            const pt = worldToCanvas(points[k].x, points[k].y, width, height);
            ctx.lineTo(pt.cx, pt.cy);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }

    // AoA rays: each sensor's simulated bearing toward the pin
    if (bearings.length === sensors.length) {
      ctx.strokeStyle = "rgba(56, 189, 248, 0.55)";
      ctx.lineWidth = 1;
      for (let i = 0; i < sensors.length; i++) {
        const s = sensors[i];
        const rad = (bearings[i] * Math.PI) / 180;
        const far = {
          x: s.x + Math.sin(rad) * maxRange * 1.4,
          y: s.y + Math.cos(rad) * maxRange * 1.4,
        };
        const a = worldToCanvas(s.x, s.y, width, height);
        const b = worldToCanvas(far.x, far.y, width, height);
        ctx.beginPath();
        ctx.moveTo(a.cx, a.cy);
        ctx.lineTo(b.cx, b.cy);
        ctx.stroke();
      }
    }

    if (aoaSolution && aoaSolution.solverStatus === "converged") {
      const aoaPt = worldToCanvas(aoaSolution.estimatedX, aoaSolution.estimatedY, width, height);
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(aoaPt.cx, aoaPt.cy, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Line-of-Sight Bearing Rays from origin to estimated target
    if (solution && solution.solverStatus === "converged") {
      const estCanvas = worldToCanvas(solution.estimatedX, solution.estimatedY, width, height);

      // Line from origin
      ctx.strokeStyle = "rgba(255, 122, 26, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(origin.cx, origin.cy);
      ctx.lineTo(estCanvas.cx, estCanvas.cy);
      ctx.stroke();

      // Confidence circle
      const scale = origin.scale;
      const radiusPx = solution.confidenceRadiusMeters * scale;
      ctx.fillStyle = "rgba(255, 122, 26, 0.08)";
      ctx.beginPath();
      ctx.arc(estCanvas.cx, estCanvas.cy, Math.max(8, radiusPx), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 122, 26, 0.7)";
      ctx.setLineDash([2, 2]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Target Emitter Pin
      ctx.fillStyle = "#ff7a1a";
      ctx.beginPath();
      ctx.arc(estCanvas.cx, estCanvas.cy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Target Pin Label
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px ui-monospace, monospace";
      ctx.fillText(
        `EMITTER: (${solution.estimatedX}m, ${solution.estimatedY}m)`,
        estCanvas.cx + 10,
        estCanvas.cy - 6
      );
      ctx.fillStyle = "#ffb020";
      ctx.font = "10px ui-monospace, monospace";
      ctx.fillText(
        `${solution.distanceMeters}m @ ${solution.bearingDegrees}° N`,
        estCanvas.cx + 10,
        estCanvas.cy + 8
      );
    }

    // Draw Sensor Nodes
    for (const sensor of sensors) {
      const sp = worldToCanvas(sensor.x, sensor.y, width, height);

      ctx.fillStyle = sensor.color;
      ctx.beginPath();
      ctx.arc(sp.cx, sp.cy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.fillStyle = "#eef3f8";
      ctx.font = "10px ui-monospace, monospace";
      ctx.fillText(`${sensor.label} (${sensor.x.toFixed(1)}, ${sensor.y.toFixed(1)})`, sp.cx + 9, sp.cy + 3);
    }
  }, [sensors, targetEmitter, medium, solution, aoaSolution, bearings, arrivalTimes, maxRange, worldToCanvas]);

  // Drag interaction to move sensors or the target emitter
  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicked near target emitter
    const estCanvas = worldToCanvas(targetEmitter.x, targetEmitter.y, canvas.width, canvas.height);
    if (Math.hypot(x - estCanvas.cx, y - estCanvas.cy) < 14) {
      setDraggingNodeId("emitter");
      return;
    }

    // Check if clicked near a sensor
    for (const s of sensors) {
      const sp = worldToCanvas(s.x, s.y, canvas.width, canvas.height);
      if (Math.hypot(x - sp.cx, y - sp.cy) < 14) {
        setDraggingNodeId(s.id);
        return;
      }
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!draggingNodeId || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const { wx, wy } = canvasToWorld(x, y, canvas.width, canvas.height);

    if (draggingNodeId === "emitter") {
      setTargetEmitter({ x: Math.round(wx * 2) / 2, y: Math.round(wy * 2) / 2 });
    } else {
      setSensors((prev) =>
        prev.map((s) => (s.id === draggingNodeId ? { ...s, x: Math.round(wx * 2) / 2, y: Math.round(wy * 2) / 2 } : s))
      );
    }
  }

  function handleMouseUp() {
    setDraggingNodeId(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Controls & Presets */}
      <div className="flex flex-col gap-4 rounded-2xl border border-probe-border bg-probe-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-probe-border pb-4">
          <div>
            <h2 className="text-base font-semibold text-probe-ink">
              TDoA Hyperbolic Geolocation &amp; Direction Finder
            </h2>
            <p className="text-xs text-probe-muted">
              Simulated timings only. Acoustic delays are milliseconds. RF mode replays synthetic nanosecond stamps at the speed of light. This page does not measure a live microwave transmitter.
            </p>
          </div>

          {/* Medium Toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-probe-border bg-probe-bg p-1 text-xs">
            <button
              type="button"
              onClick={() => setMedium("acoustic")}
              className={clsx(
                "rounded px-3 py-1 font-medium transition-colors",
                medium === "acoustic"
                  ? "bg-probe-accent text-probe-bg font-semibold"
                  : "text-probe-muted hover:text-probe-ink"
              )}
            >
              Acoustic / Ultrasonic (343 m/s)
            </button>
            <button
              type="button"
              onClick={() => setMedium("rf")}
              className={clsx(
                "rounded px-3 py-1 font-medium transition-colors",
                medium === "rf"
                  ? "bg-probe-accent text-probe-bg font-semibold"
                  : "text-probe-muted hover:text-probe-ink"
              )}
            >
              Pulsed RF / Microwave (Speed of Light)
            </button>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-probe-muted">Load Scenario:</span>
          {TRIANGULATION_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => loadPreset(p.id)}
              className={clsx(
                "rounded-lg border px-3 py-1.5 transition-colors",
                selectedPresetId === p.id
                  ? "border-probe-accent bg-probe-accent/15 text-probe-accent font-semibold"
                  : "border-probe-border bg-probe-surface2 text-probe-muted hover:text-probe-ink"
              )}
            >
              {p.title}
            </button>
          ))}
        </div>
        <p className="text-xs text-probe-muted">
          {TRIANGULATION_PRESETS.find((p) => p.id === selectedPresetId)?.description}
        </p>
      </div>

      {/* Interactive Map Canvas */}
      <div className="relative overflow-hidden rounded-2xl border border-probe-border bg-[#0b0f14] shadow-glow-probe">
        <canvas
          ref={canvasRef}
          width={900}
          height={480}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full h-[320px] sm:h-[440px] block cursor-crosshair"
        />

        {/* Overlay instructions */}
        <div className="absolute left-3 top-3 rounded-lg border border-probe-border/60 bg-black/75 px-3 py-1.5 text-[11px] font-mono text-probe-muted backdrop-blur pointer-events-none">
          Drag sensors or target pin to recalculate multilateration in real time
        </div>

        {/* Solved Results Badge */}
        {solution && (
          <div className="absolute right-3 bottom-3 rounded-xl border border-probe-accent/40 bg-black/85 p-3 text-xs font-mono text-probe-ink backdrop-blur space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="font-bold text-probe-accent">TDoA {solution.solverStatus.toUpperCase()}</span>
            </div>
            <div>
              Emitter Position: <span className="text-white font-bold">{solution.estimatedX}m E, {solution.estimatedY}m N</span>
            </div>
            <div>
              Distance from Center: <span className="text-probe-accent">{solution.distanceMeters} meters</span>
            </div>
            <div>
              Line of Sight Bearing: <span className="text-probe-accent">{solution.bearingDegrees}°</span> (True North)
            </div>
            <div>
              Confidence Radius: <span className="text-probe-steel">±{solution.confidenceRadiusMeters}m</span>
            </div>
            <div>
              GDOP: <span className="text-probe-steel">{solution.gdop}</span>
              {aoaSolution ? ` · AoA ${aoaSolution.estimatedX}m, ${aoaSolution.estimatedY}m` : ""}
            </div>
          </div>
        )}
      </div>

      {/* Sensor Timings Table */}
      <div className="rounded-2xl border border-probe-border bg-probe-surface p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-probe-accent">
          Sensor Array Node Telemetry &amp; Relative Arrival Delays
        </h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-probe-border text-probe-muted">
                <th className="pb-2">Node</th>
                <th className="pb-2">Coordinates (X, Y)</th>
                <th className="pb-2">Distance to Emitter</th>
                <th className="pb-2">Arrival Time (t)</th>
                <th className="pb-2">Relative Delay (Δt to Node 1)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-probe-border/50 text-probe-ink">
              {sensors.map((s, idx) => {
                const dist = Math.hypot(s.x - targetEmitter.x, s.y - targetEmitter.y);
                const t = arrivalTimes[idx] ?? 0;
                const dt = (arrivalTimes[idx] ?? 0) - (arrivalTimes[0] ?? 0);
                return (
                  <tr key={s.id} className="py-2">
                    <td className="py-2 flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="font-bold">{s.label}</span>
                    </td>
                    <td className="py-2">
                      ({s.x.toFixed(1)}m, {s.y.toFixed(1)}m)
                    </td>
                    <td className="py-2">{dist.toFixed(2)}m</td>
                    <td className="py-2">
                      {medium === "acoustic" ? `${t.toFixed(2)} ms` : `${(t * 1000).toFixed(1)} µs`}
                    </td>
                    <td className="py-2">
                      {idx === 0
                        ? "0.00 (Ref)"
                        : medium === "acoustic"
                        ? `${dt > 0 ? "+" : ""}${dt.toFixed(3)} ms`
                        : `${dt > 0 ? "+" : ""}${(dt * 1e6).toFixed(1)} ns`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
