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

  it('waits for 75 percent angular coverage before finalizing circularity', () => {
    const session = new CircularitySession();
    for (let sector = 0; sector < 17; sector += 1) {
      const angle = (sector * 15 * Math.PI) / 180;
      session.addSample(Math.cos(angle), Math.sin(angle));
    }

    const result = session.result();
    expect(result.sampleCount).toBe(17);
    expect(result.coveredSectorCount).toBe(17);
    expect(result.totalSectorCount).toBe(24);
    expect(result.coveragePercent).toBeCloseTo((17 / 24) * 100, 6);
    expect(result.ready).toBe(false);
    expect(result.scorePercent).toBeNull();
    expect(result.radialSpread).toBeNull();
  });

  it('uses the outermost sample per direction so transient inward movement does not lower circularity', () => {
    const session = new CircularitySession();
    session.addSample(0.6, 0); // same sector as the next sample; must not become the sector radius
    session.addSample(1, 0);

    for (let sector = 1; sector < 18; sector += 1) {
      const angle = (sector * 15 * Math.PI) / 180;
      session.addSample(Math.cos(angle), Math.sin(angle));
    }

    const result = session.result();
    expect(result.ready).toBe(true);
    expect(result.coveredSectorCount).toBe(18);
    expect(result.minRadius).toBeCloseTo(1, 6);
    expect(result.maxRadius).toBeCloseTo(1, 6);
    expect(result.radialSpread).toBeCloseTo(0, 6);
    expect(result.scorePercent).toBeCloseTo(100, 6);
  });

  it('reports directional outer-envelope spread after sufficient coverage', () => {
    const session = new CircularitySession();
    for (let sector = 0; sector < 18; sector += 1) {
      const radius = sector === 5 ? 0.8 : 1;
      const angle = (sector * 15 * Math.PI) / 180;
      session.addSample(radius * Math.cos(angle), radius * Math.sin(angle));
    }

    const result = session.result();
    expect(result.ready).toBe(true);
    expect(result.minRadius).toBeCloseTo(0.8, 6);
    expect(result.maxRadius).toBeCloseTo(1, 6);
    expect(result.radialSpread).toBeCloseTo(0.2, 6);
    expect(result.meanRadius).toBeCloseTo(17.8 / 18, 6);
    expect(result.scorePercent).toBeCloseTo((1 - 0.2 / (17.8 / 18)) * 100, 6);
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
