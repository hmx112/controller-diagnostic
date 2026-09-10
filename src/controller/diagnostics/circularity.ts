export interface CircularityResult {
  sampleCount: number;
  meanRadius: number | null;
  minRadius: number | null;
  maxRadius: number | null;
  radialSpread: number | null;
  scorePercent: number | null;
}

export class CircularitySession {
  private readonly perimeterFloor: number;
  private radii: number[] = [];

  constructor(perimeterFloor = 0.5) {
    this.perimeterFloor = Math.max(0, perimeterFloor);
  }

  addSample(x: number, y: number): void {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const radius = Math.hypot(x, y);
    if (radius < this.perimeterFloor) return;
    this.radii.push(radius);
  }

  reset(): void {
    this.radii = [];
  }

  result(): CircularityResult {
    if (this.radii.length === 0) {
      return {
        sampleCount: 0,
        meanRadius: null,
        minRadius: null,
        maxRadius: null,
        radialSpread: null,
        scorePercent: null,
      };
    }

    const minRadius = Math.min(...this.radii);
    const maxRadius = Math.max(...this.radii);
    const meanRadius = this.radii.reduce((sum, radius) => sum + radius, 0) / this.radii.length;
    const radialSpread = maxRadius - minRadius;
    const scorePercent = meanRadius === 0
      ? null
      : Math.max(0, Math.min(100, (1 - radialSpread / meanRadius) * 100));

    return {
      sampleCount: this.radii.length,
      meanRadius,
      minRadius,
      maxRadius,
      radialSpread,
      scorePercent,
    };
  }
}
