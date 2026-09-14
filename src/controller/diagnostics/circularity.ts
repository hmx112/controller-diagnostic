export interface CircularityResult {
  sampleCount: number;
  coveredSectorCount: number;
  totalSectorCount: number;
  coveragePercent: number;
  ready: boolean;
  meanRadius: number | null;
  minRadius: number | null;
  maxRadius: number | null;
  radialSpread: number | null;
  scorePercent: number | null;
}

export class CircularitySession {
  private readonly perimeterFloor: number;
  private readonly sectorCount: number;
  private readonly requiredSectorCount: number;
  private outerRadii: Array<number | null>;
  private sampleCount = 0;

  constructor(perimeterFloor = 0.5, sectorCount = 24, requiredCoverage = 0.75) {
    this.perimeterFloor = Math.max(0, perimeterFloor);
    this.sectorCount = Math.max(1, Math.floor(sectorCount));
    const clampedCoverage = Math.max(0, Math.min(1, requiredCoverage));
    this.requiredSectorCount = Math.max(1, Math.ceil(this.sectorCount * clampedCoverage));
    this.outerRadii = Array.from({ length: this.sectorCount }, () => null);
  }

  addSample(x: number, y: number): void {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;

    const radius = Math.hypot(x, y);
    if (radius < this.perimeterFloor) return;

    const fullTurn = Math.PI * 2;
    const sectorWidth = fullTurn / this.sectorCount;
    const normalizedAngle = (Math.atan2(y, x) + fullTurn) % fullTurn;
    const sectorIndex = Math.round(normalizedAngle / sectorWidth) % this.sectorCount;
    const previous = this.outerRadii[sectorIndex];

    if (previous == null || radius > previous) {
      this.outerRadii[sectorIndex] = radius;
    }
    this.sampleCount += 1;
  }

  reset(): void {
    this.outerRadii = Array.from({ length: this.sectorCount }, () => null);
    this.sampleCount = 0;
  }

  result(): CircularityResult {
    const coveredRadii = this.outerRadii.filter((radius): radius is number => radius !== null);
    const coveredSectorCount = coveredRadii.length;
    const coveragePercent = (coveredSectorCount / this.sectorCount) * 100;
    const ready = coveredSectorCount >= this.requiredSectorCount;

    if (!ready) {
      return {
        sampleCount: this.sampleCount,
        coveredSectorCount,
        totalSectorCount: this.sectorCount,
        coveragePercent,
        ready: false,
        meanRadius: null,
        minRadius: null,
        maxRadius: null,
        radialSpread: null,
        scorePercent: null,
      };
    }

    const minRadius = Math.min(...coveredRadii);
    const maxRadius = Math.max(...coveredRadii);
    const meanRadius = coveredRadii.reduce((sum, radius) => sum + radius, 0) / coveredRadii.length;
    const radialSpread = maxRadius - minRadius;
    const scorePercent = meanRadius === 0
      ? null
      : Math.max(0, Math.min(100, (1 - radialSpread / meanRadius) * 100));

    return {
      sampleCount: this.sampleCount,
      coveredSectorCount,
      totalSectorCount: this.sectorCount,
      coveragePercent,
      ready: true,
      meanRadius,
      minRadius,
      maxRadius,
      radialSpread,
      scorePercent,
    };
  }
}
