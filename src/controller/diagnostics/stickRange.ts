export interface StickRangeResult {
  sampleCount: number;
  minX: number | null;
  maxX: number | null;
  minY: number | null;
  maxY: number | null;
  maxRadial: number | null;
  maxRadialPercent: number | null;
}

export class StickRangeSession {
  private sampleCount = 0;
  private minX: number | null = null;
  private maxX: number | null = null;
  private minY: number | null = null;
  private maxY: number | null = null;
  private maxRadial: number | null = null;

  addSample(x: number, y: number): void {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;

    const radial = Math.hypot(x, y);
    this.sampleCount += 1;
    this.minX = this.minX === null ? x : Math.min(this.minX, x);
    this.maxX = this.maxX === null ? x : Math.max(this.maxX, x);
    this.minY = this.minY === null ? y : Math.min(this.minY, y);
    this.maxY = this.maxY === null ? y : Math.max(this.maxY, y);
    this.maxRadial = this.maxRadial === null ? radial : Math.max(this.maxRadial, radial);
  }

  reset(): void {
    this.sampleCount = 0;
    this.minX = null;
    this.maxX = null;
    this.minY = null;
    this.maxY = null;
    this.maxRadial = null;
  }

  result(): StickRangeResult {
    return {
      sampleCount: this.sampleCount,
      minX: this.minX,
      maxX: this.maxX,
      minY: this.minY,
      maxY: this.maxY,
      maxRadial: this.maxRadial,
      maxRadialPercent: this.maxRadial === null ? null : this.maxRadial * 100,
    };
  }
}
