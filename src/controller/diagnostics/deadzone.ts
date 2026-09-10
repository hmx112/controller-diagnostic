export interface DeadzoneResult {
  active: boolean;
  noiseFloor: number;
  sampleCount: number;
  firstThresholdMagnitude: number | null;
  peakMagnitude: number | null;
}

export class DeadzoneSession {
  private active = false;
  private noiseFloor = 0.02;
  private sampleCount = 0;
  private firstThresholdMagnitude: number | null = null;
  private peakMagnitude: number | null = null;

  start(noiseFloor = 0.02): void {
    this.reset();
    this.noiseFloor = Number.isFinite(noiseFloor) ? Math.max(0, noiseFloor) : 0.02;
    this.active = true;
  }

  addSample(x: number, y: number): void {
    if (!this.active || !Number.isFinite(x) || !Number.isFinite(y)) return;

    const magnitude = Math.hypot(x, y);
    this.sampleCount += 1;
    this.peakMagnitude = this.peakMagnitude === null ? magnitude : Math.max(this.peakMagnitude, magnitude);

    if (this.firstThresholdMagnitude === null && magnitude > this.noiseFloor) {
      this.firstThresholdMagnitude = magnitude;
    }
  }

  reset(): void {
    this.active = false;
    this.sampleCount = 0;
    this.firstThresholdMagnitude = null;
    this.peakMagnitude = null;
  }

  result(): DeadzoneResult {
    return {
      active: this.active,
      noiseFloor: this.noiseFloor,
      sampleCount: this.sampleCount,
      firstThresholdMagnitude: this.firstThresholdMagnitude,
      peakMagnitude: this.peakMagnitude,
    };
  }
}
