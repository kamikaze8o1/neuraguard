// Time Difference of Arrival (TDoA) and Angle of Arrival (AoA)
// Geolocation & Multilateration Engine for NeuraProbe.

export type PropagationMedium = "acoustic" | "rf";

export interface SensorNode {
  id: string;
  label: string;
  x: number; // meters from origin
  y: number; // meters from origin
  measuredTimeMs?: number; // timestamp in ms (for acoustic or relative RF)
  bearingDeg?: number; // AoA bearing in degrees (0 = North/+Y, 90 = East/+X)
  color: string;
}

export interface TriangulationResult {
  estimatedX: number; // meters
  estimatedY: number; // meters
  distanceMeters: number; // distance from origin (0,0)
  bearingDegrees: number; // bearing from origin (0 = North, 90 = East)
  residualError: number; // fit residual
  confidenceRadiusMeters: number; // estimated 95% error circle radius
  /** Geometric dilution of precision. Dimensionless. Higher means a worse sensor layout. */
  gdop: number;
  solverStatus: "converged" | "diverged" | "insufficient-sensors";
}

export const PROPAGATION_SPEEDS: Record<PropagationMedium, number> = {
  acoustic: 343.2, // meters per second in air at 20°C
  rf: 299792458, // meters per second in air/vacuum (speed of light)
};

export interface ScenarioPreset {
  id: string;
  title: string;
  description: string;
  medium: PropagationMedium;
  sensors: SensorNode[];
  simulatedEmitter: { x: number; y: number };
}

export const TRIANGULATION_PRESETS: ScenarioPreset[] = [
  {
    id: "window-perimeter",
    title: "Embassy Residence Window Threat",
    description:
      "Simulated room perimeter. Three sensors along a window wall. Arrival times are computed from the pin, not measured from a live transmitter.",
    medium: "acoustic",
    simulatedEmitter: { x: 8.5, y: 18.0 }, // ~20 m outside the window
    sensors: [
      { id: "s1", label: "Sensor 1 (Left Window)", x: -3.0, y: 2.0, color: "#39ff8f" },
      { id: "s2", label: "Sensor 2 (Center Wall)", x: 0.0, y: 2.0, color: "#ffb020" },
      { id: "s3", label: "Sensor 3 (Right Window)", x: 3.0, y: 2.0, color: "#38bdf8" },
    ],
  },
  {
    id: "standoff-van",
    title: "Standoff Vehicle / Van at 75m",
    description:
      "Simulated geometry only. RF delays are synthetic timestamps at the speed of light. A phone microphone cannot time nanosecond microwave arrivals.",
    medium: "rf",
    simulatedEmitter: { x: 40.0, y: 63.4 }, // ~75 m from origin
    sensors: [
      { id: "s1", label: "Node A (North Balcony)", x: 0.0, y: 15.0, color: "#39ff8f" },
      { id: "s2", label: "Node B (East Corner)", x: 12.0, y: 0.0, color: "#ffb020" },
      { id: "s3", label: "Node C (West Corner)", x: -12.0, y: 0.0, color: "#38bdf8" },
      { id: "s4", label: "Node D (South Room)", x: 0.0, y: -10.0, color: "#f43f5e" },
    ],
  },
  {
    id: "room-ultrasonic-bug",
    title: "Ultrasonic Pest / Parametric Beam",
    description:
      "Simulated in-room acoustic geometry for a nearby ultrasonic source. Sensors are the phones you place yourself; nothing is geolocated off this device.",
    medium: "acoustic",
    simulatedEmitter: { x: -2.2, y: 3.5 },
    sensors: [
      { id: "s1", label: "Mic 1 (Phone on Desk)", x: 0.0, y: 0.0, color: "#39ff8f" },
      { id: "s2", label: "Mic 2 (Laptop on Table)", x: 2.5, y: 1.0, color: "#ffb020" },
      { id: "s3", label: "Mic 3 (Tablet on Bookshelf)", x: -2.0, y: 0.5, color: "#38bdf8" },
    ],
  },
];

/**
 * Calculates arrival times for a set of sensors given a target emitter coordinate.
 * Used for synthetic preset generation and calibration.
 */
export function simulateArrivalTimes(
  emitter: { x: number; y: number },
  sensors: SensorNode[],
  medium: PropagationMedium
): number[] {
  const speed = PROPAGATION_SPEEDS[medium];
  return sensors.map((s) => {
    const dist = Math.sqrt((s.x - emitter.x) ** 2 + (s.y - emitter.y) ** 2);
    // return arrival time in milliseconds
    return (dist / speed) * 1000;
  });
}

/**
 * Solves 2D TDoA Multilateration using non-linear least squares (Levenberg-Marquardt approach).
 * Finds (x, y) minimizing:
 * sum_i [ (d_i - d_ref) - c * (t_i - t_ref) ]^2
 */
export function solveTDoA(
  sensors: SensorNode[],
  arrivalTimesMs: number[],
  medium: PropagationMedium,
  initialGuess: { x: number; y: number } = { x: 0, y: 15 }
): TriangulationResult {
  if (sensors.length < 3 || arrivalTimesMs.length < 3) {
    return emptyFix("insufficient-sensors");
  }

  const c = PROPAGATION_SPEEDS[medium];
  const refSensor = sensors[0];
  const refTimeS = arrivalTimesMs[0] / 1000;

  // Expected range differences relative to sensor 0
  const measuredDeltaD: number[] = [];
  for (let i = 1; i < sensors.length; i++) {
    const dtS = arrivalTimesMs[i] / 1000 - refTimeS;
    measuredDeltaD.push(dtS * c);
  }

  let x = initialGuess.x;
  let y = initialGuess.y;
  const maxIterations = 60;
  const tolerance = 1e-4;

  let residual = Infinity;
  let converged = false;

  for (let iter = 0; iter < maxIterations; iter++) {
    const d0 = Math.sqrt((x - refSensor.x) ** 2 + (y - refSensor.y) ** 2) || 1e-5;

    // Build Jacobian and error vector
    let j11 = 0;
    let j12 = 0;
    let j22 = 0;
    let b1 = 0;
    let b2 = 0;
    let currentResidualSum = 0;

    for (let i = 1; i < sensors.length; i++) {
      const s = sensors[i];
      const di = Math.sqrt((x - s.x) ** 2 + (y - s.y) ** 2) || 1e-5;
      const modelDeltaD = di - d0;
      const error = measuredDeltaD[i - 1] - modelDeltaD;
      currentResidualSum += error ** 2;

      // Partial derivatives
      const dErrorDx = (x - s.x) / di - (x - refSensor.x) / d0;
      const dErrorDy = (y - s.y) / di - (y - refSensor.y) / d0;

      j11 += dErrorDx * dErrorDx;
      j12 += dErrorDx * dErrorDy;
      j22 += dErrorDy * dErrorDy;

      b1 += dErrorDx * error;
      b2 += dErrorDy * error;
    }

    residual = Math.sqrt(currentResidualSum / (sensors.length - 1));

    // Damping / Regularization
    const lambda = 0.01;
    j11 += lambda;
    j22 += lambda;

    const det = j11 * j22 - j12 * j12;
    if (Math.abs(det) < 1e-12) break;

    const dx = (j22 * b1 - j12 * b2) / det;
    const dy = (-j12 * b1 + j11 * b2) / det;

    x += dx;
    y += dy;

    if (Math.sqrt(dx * dx + dy * dy) < tolerance) {
      converged = true;
      break;
    }
  }

  const distance = Math.sqrt(x * x + y * y);
  // Bearing in degrees from North (+Y), clockwise
  let bearing = (Math.atan2(x, y) * 180) / Math.PI;
  if (bearing < 0) bearing += 360;

  const gdop = tdoaGdop(x, y, sensors);
  // Acoustic: ~1 ms of timing slack maps to ~0.34 m, scaled by geometry.
  // RF numbers here are synthetic; the radius is a geometry hint, not a surveyed fix.
  const timingSlackMeters = medium === "acoustic" ? 0.34 : 0.5;
  const confidenceRadius = Math.max(0.2, Math.min(40, residual * 1.2 + gdop * timingSlackMeters));

  return {
    estimatedX: Math.round(x * 10) / 10,
    estimatedY: Math.round(y * 10) / 10,
    distanceMeters: Math.round(distance * 10) / 10,
    bearingDegrees: Math.round(bearing * 10) / 10,
    residualError: Math.round(residual * 100) / 100,
    confidenceRadiusMeters: Math.round(confidenceRadius * 10) / 10,
    gdop: Math.round(gdop * 100) / 100,
    solverStatus: converged ? "converged" : "diverged",
  };
}

function emptyFix(status: TriangulationResult["solverStatus"]): TriangulationResult {
  return {
    estimatedX: 0,
    estimatedY: 0,
    distanceMeters: 0,
    bearingDegrees: 0,
    residualError: 0,
    confidenceRadiusMeters: 0,
    gdop: 0,
    solverStatus: status,
  };
}

/** Bearing from `from` toward `to`. 0° is north (+Y), 90° is east (+X). */
export function bearingDegFromNorth(from: { x: number; y: number }, to: { x: number; y: number }): number {
  let bearing = (Math.atan2(to.x - from.x, to.y - from.y) * 180) / Math.PI;
  if (bearing < 0) bearing += 360;
  return bearing;
}

/**
 * Geometric dilution of precision for a 2D TDoA layout.
 * Rows of H are differences of unit vectors from the estimate to each sensor vs the reference.
 */
function tdoaGdop(x: number, y: number, sensors: SensorNode[]): number {
  const unit = (s: SensorNode) => {
    const dx = x - s.x;
    const dy = y - s.y;
    const d = Math.hypot(dx, dy) || 1e-6;
    return { x: dx / d, y: dy / d };
  };
  const u0 = unit(sensors[0]);
  let j11 = 0;
  let j12 = 0;
  let j22 = 0;
  for (let i = 1; i < sensors.length; i++) {
    const ui = unit(sensors[i]);
    const hx = ui.x - u0.x;
    const hy = ui.y - u0.y;
    j11 += hx * hx;
    j12 += hx * hy;
    j22 += hy * hy;
  }
  const det = j11 * j22 - j12 * j12;
  if (Math.abs(det) < 1e-9) return 99;
  const trace = (j22 + j11) / det;
  return Math.sqrt(Math.max(0, trace));
}

/**
 * Least-squares intersection of bearing lines.
 * Each sensor needs bearingDeg (0 = north). Needs at least two bearings.
 */
export function solveAoA(sensors: SensorNode[]): TriangulationResult {
  const armed = sensors.filter((s) => typeof s.bearingDeg === "number");
  if (armed.length < 2) return emptyFix("insufficient-sensors");

  let a11 = 0;
  let a12 = 0;
  let a22 = 0;
  let b1 = 0;
  let b2 = 0;
  for (const s of armed) {
    const theta = ((s.bearingDeg as number) * Math.PI) / 180;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    // (p - s) · normal = 0, normal = (cos θ, -sin θ) for direction (sin θ, cos θ)
    const nx = cos;
    const ny = -sin;
    const rhs = s.x * nx + s.y * ny;
    a11 += nx * nx;
    a12 += nx * ny;
    a22 += ny * ny;
    b1 += nx * rhs;
    b2 += ny * rhs;
  }
  const det = a11 * a22 - a12 * a12;
  if (Math.abs(det) < 1e-12) return emptyFix("diverged");

  const x = (a22 * b1 - a12 * b2) / det;
  const y = (-a12 * b1 + a11 * b2) / det;
  let residualSq = 0;
  for (const s of armed) {
    const theta = ((s.bearingDeg as number) * Math.PI) / 180;
    const nx = Math.cos(theta);
    const ny = -Math.sin(theta);
    const err = (x - s.x) * nx + (y - s.y) * ny;
    residualSq += err * err;
  }
  const residual = Math.sqrt(residualSq / armed.length);
  const distance = Math.hypot(x, y);
  let bearing = (Math.atan2(x, y) * 180) / Math.PI;
  if (bearing < 0) bearing += 360;

  return {
    estimatedX: Math.round(x * 10) / 10,
    estimatedY: Math.round(y * 10) / 10,
    distanceMeters: Math.round(distance * 10) / 10,
    bearingDegrees: Math.round(bearing * 10) / 10,
    residualError: Math.round(residual * 100) / 100,
    confidenceRadiusMeters: Math.round(Math.max(0.2, Math.min(40, residual * 2)) * 10) / 10,
    gdop: Math.round(tdoaGdop(x, y, armed) * 100) / 100,
    solverStatus: Number.isFinite(x) && Number.isFinite(y) ? "converged" : "diverged",
  };
}

/**
 * Computes hyperbolic curve points between two sensors for visual rendering.
 * Distance difference: d1 - d2 = deltaD
 */
export function generateHyperbolaPoints(
  s1: { x: number; y: number },
  s2: { x: number; y: number },
  deltaD: number,
  viewRangeMeters = 50,
  stepPoints = 120
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const midX = (s1.x + s2.x) / 2;
  const midY = (s1.y + s2.y) / 2;
  const dSensors = Math.sqrt((s1.x - s2.x) ** 2 + (s1.y - s2.y) ** 2);

  // If deltaD exceeds distance between sensors, hyperbola has no real branch
  if (Math.abs(deltaD) >= dSensors) return [];

  // Angle of baseline
  const angle = Math.atan2(s2.y - s1.y, s2.x - s1.x);

  // Standard hyperbola parameters: x^2/a^2 - y^2/b^2 = 1
  const a = Math.abs(deltaD) / 2;
  const c = dSensors / 2;
  const b = Math.sqrt(Math.max(1e-4, c * c - a * a));

  const sign = deltaD > 0 ? 1 : -1;

  for (let i = -stepPoints / 2; i <= stepPoints / 2; i++) {
    const t = (i / (stepPoints / 2)) * 2.5; // parameter
    const localX = sign * a * Math.cosh(t);
    const localY = b * Math.sinh(t);

    // Rotate and translate back to world coordinates
    const rotX = localX * Math.cos(angle) - localY * Math.sin(angle);
    const rotY = localX * Math.sin(angle) + localY * Math.cos(angle);

    const worldX = midX + rotX;
    const worldY = midY + rotY;

    if (Math.abs(worldX) <= viewRangeMeters * 1.5 && Math.abs(worldY) <= viewRangeMeters * 1.5) {
      points.push({ x: worldX, y: worldY });
    }
  }

  return points;
}
