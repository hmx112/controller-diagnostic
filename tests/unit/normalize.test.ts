import { describe, expect, it } from 'vitest';
import { normalizeGamepad } from '../../src/controller/core/normalize';
import { createNonStandardGamepad } from '../fixtures/nonStandard';
import { createStandardGamepad } from '../fixtures/standardGamepad';

describe('normalizeGamepad', () => {
  it('copies browser-like button and axis values into an internal snapshot', () => {
    const sourceButtons = [{ pressed: true, touched: true, value: 1 }];
    const sourceAxes = [0.25, -0.5];
    const gamepad = createNonStandardGamepad({ buttons: sourceButtons, axes: sourceAxes });
    const snapshot = normalizeGamepad(gamepad, 'raw');

    expect(snapshot.buttons[0]).toEqual({ index: 0, pressed: true, touched: true, value: 1 });
    expect(snapshot.axes).toEqual([{ index: 0, value: 0.25 }, { index: 1, value: -0.5 }]);
    expect(snapshot.buttons).not.toBe(sourceButtons);
    expect(snapshot.axes).not.toBe(sourceAxes);
  });

  it('marks standard mapping explicitly', () => {
    const snapshot = normalizeGamepad(createStandardGamepad(), 'generic-standard');
    expect(snapshot.capabilities.standardMapping).toBe(true);
    expect(snapshot.capabilities.profileId).toBe('generic-standard');
  });
});
