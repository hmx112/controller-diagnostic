import { describe, expect, it } from 'vitest';
import { resolveControllerMode } from '../../src/controller/mapping/resolver';
import { standardAxisRole, STANDARD_BUTTON_LABELS } from '../../src/controller/mapping/standard';
import { rawAxisLabel, rawButtonLabel } from '../../src/controller/mapping/raw';
import { createNonStandardGamepad } from '../fixtures/nonStandard';
import { createStandardGamepad } from '../fixtures/standardGamepad';

describe('mapping resolver', () => {
  it('uses generic semantics for a standard controller', () => {
    expect(resolveControllerMode(createStandardGamepad())).toEqual({ mode: 'standard', profileId: 'generic-standard' });
  });

  it('keeps non-standard controllers in raw mode even when the id looks like a DualShock 4', () => {
    const gamepad = createNonStandardGamepad({ id: 'Sony DualShock 4 Wireless Controller' });
    expect(resolveControllerMode(gamepad)).toEqual({ mode: 'raw', profileId: 'raw' });
  });

  it('recognizes a DualShock 4 overlay only after the browser reports standard mapping', () => {
    const gamepad = createStandardGamepad({ id: 'Sony Interactive Entertainment Wireless Controller' });
    expect(resolveControllerMode(gamepad)).toEqual({ mode: 'standard', profileId: 'dualshock4' });
  });

  it('provides neutral standard and raw labels', () => {
    expect(STANDARD_BUTTON_LABELS[6]).toBe('Left Trigger');
    expect(standardAxisRole(2)).toBe('right-x');
    expect(rawButtonLabel(3)).toBe('Button 3');
    expect(rawAxisLabel(2)).toBe('Axis 2');
  });
});
