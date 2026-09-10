import { describe, expect, it } from 'vitest';
import { centerDeviation } from '../../src/controller/diagnostics/centerDeviation';
import { StickRangeSession } from '../../src/controller/diagnostics/stickRange';
import { CircularitySession } from '../../src/controller/diagnostics/circularity';
import { DeadzoneSession } from '../../src/controller/diagnostics/deadzone';

describe('controller diagnostics', () => {
  it('calculates radial browser-observed center deviation', () => {
    expect(centerDeviation(0.03, 0.04)).toEqual({ magnitude: 0.05, percent: 5 });
  });

  it('tracks maximum observed stick range during a session', () => {
    const session = new StickRangeSession();
    session.addSample(1, 0);
    session.addSample(0, -0.8);
    const result = session.result();
    expect(result.maxRadial).toBeCloseTo(1, 6);
    expect(result.maxX).toBe(1);
    expect(result.minY).toBe(-0.8);
    expect(result.sampleCount).toBe(2);
  });

  it('returns null measurements for an empty range session', () => {
    const result = new StickRangeSession().result();
    expect(result.sampleCount).toBe(0);
    expect(result.maxRadial).toBeNull();
  });

  it('reports circularity from perimeter samples only', () => {
    const session = new CircularitySession();
    session.addSample(1, 0);
    session.addSample(0, 0.95);
    session.addSample(-0.9, 0);
    session.addSample(0.1, 0.1); // below default perimeter floor; ignored
    const result = session.result();
    expect(result.sampleCount).toBe(3);
    expect(result.minRadius).toBeCloseTo(0.9, 6);
    expect(result.maxRadius).toBeCloseTo(1, 6);
    expect(result.radialSpread).toBeCloseTo(0.1, 6);
  });

  it('records the first threshold crossing only after deadzone measurement starts', () => {
    const session = new DeadzoneSession();
    session.addSample(0.5, 0);
    expect(session.result().firstThresholdMagnitude).toBeNull();
    session.start(0.02);
    session.addSample(0.01, 0);
    session.addSample(0.071, 0);
    session.addSample(0.2, 0);
    expect(session.result().firstThresholdMagnitude).toBeCloseTo(0.071, 6);
  });

  it('ignores non-finite diagnostic samples', () => {
    const session = new StickRangeSession();
    session.addSample(Number.NaN, 0);
    session.addSample(0, Number.POSITIVE_INFINITY);
    expect(session.result().sampleCount).toBe(0);
  });
});
