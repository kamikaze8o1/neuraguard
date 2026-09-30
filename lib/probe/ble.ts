// Optional Web Bluetooth Heart Rate Service (GATT 0x180D) client.
// Gracefully no-ops on browsers without Web Bluetooth support (all of iOS
// Safari, and most non-Chromium desktop browsers).
import type { BleHrReading, BleSupportState } from "./types";

const HEART_RATE_SERVICE = "heart_rate";
const HEART_RATE_MEASUREMENT_CHAR = "heart_rate_measurement";

export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}

export interface BleHrClientOptions {
  onReading?: (reading: BleHrReading) => void;
  onStateChange?: (state: BleSupportState) => void;
  onDisconnected?: () => void;
}

function parseHeartRateMeasurement(value: DataView): BleHrReading {
  const flags = value.getUint8(0);
  const is16Bit = (flags & 0x1) === 1;
  let offset = 1;
  let bpm: number;
  if (is16Bit) {
    bpm = value.getUint16(offset, true);
    offset += 2;
  } else {
    bpm = value.getUint8(offset);
    offset += 1;
  }

  const energyExpendedPresent = (flags & 0x08) !== 0;
  if (energyExpendedPresent) offset += 2;

  const rrPresent = (flags & 0x10) !== 0;
  const rrIntervals: number[] = [];
  if (rrPresent) {
    while (offset + 1 < value.byteLength) {
      // RR-Interval is in units of 1/1024 second; convert to ms.
      const raw = value.getUint16(offset, true);
      rrIntervals.push(Math.round((raw / 1024) * 1000));
      offset += 2;
    }
  }

  return { t: performance.now(), bpm, rrIntervals: rrIntervals.length ? rrIntervals : undefined };
}

export class BleHrClient {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private options: BleHrClientOptions;

  constructor(options: BleHrClientOptions = {}) {
    this.options = options;
  }

  get isConnected(): boolean {
    return this.device?.gatt?.connected ?? false;
  }

  get deviceName(): string | null {
    return this.device?.name ?? null;
  }

  async connect(): Promise<void> {
    if (!isWebBluetoothSupported()) {
      this.options.onStateChange?.("unsupported");
      return;
    }
    this.options.onStateChange?.("connecting");
    try {
      if (!navigator.bluetooth) throw new Error("Web Bluetooth not available.");
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [HEART_RATE_SERVICE] }],
      });
      this.device.addEventListener("gattserverdisconnected", this.handleDisconnected);
      const server = await this.device.gatt?.connect();
      const service = await server?.getPrimaryService(HEART_RATE_SERVICE);
      const characteristic = await service?.getCharacteristic(HEART_RATE_MEASUREMENT_CHAR);
      if (!characteristic) throw new Error("Heart Rate Measurement characteristic not found.");
      this.characteristic = characteristic;
      await characteristic.startNotifications();
      characteristic.addEventListener("characteristicvaluechanged", this.handleValueChanged);
      this.options.onStateChange?.("connected");
    } catch (err) {
      this.options.onStateChange?.("error");
      throw err;
    }
  }

  disconnect(): void {
    this.characteristic?.removeEventListener("characteristicvaluechanged", this.handleValueChanged);
    this.device?.removeEventListener("gattserverdisconnected", this.handleDisconnected);
    if (this.device?.gatt?.connected) this.device.gatt.disconnect();
    this.device = null;
    this.characteristic = null;
  }

  private handleValueChanged = (event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    if (!target.value) return;
    const reading = parseHeartRateMeasurement(target.value);
    this.options.onReading?.(reading);
  };

  private handleDisconnected = () => {
    this.options.onStateChange?.("idle");
    this.options.onDisconnected?.();
  };
}
