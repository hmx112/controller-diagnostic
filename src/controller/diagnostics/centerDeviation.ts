export interface CenterDeviationResult {
  magnitude: number;
  percent: number;
}

export function centerDeviation(x: number, y: number): CenterDeviationResult {
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return { magnitude: 0, percent: 0 };
  }

  const magnitude = Math.hypot(x, y);
  return { magnitude, percent: magnitude * 100 };
}
