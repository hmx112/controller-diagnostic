import { describe, expect, it } from 'vitest';
import { resolveControllerMode } from '../../src/controller/mapping/resolver';
import { standardAxisRole, STANDARD_BUTTON_LABELS } from '../../src/controller/mapping/standard';
import { rawAxisLabel, rawButtonLabel } from '../../src/controller/mapping/raw';
import { dualShock4ButtonLabel } from '../../src/controller/profiles/dualshock4';
import { joyConButtonLabel, joyConStickRoles } from '../../src/controller/profiles/joycon';
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

  it('recognizes the physically verified DualShock 4 USB id', () => {
    const gamepad = createStandardGamepad({
      id: 'Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 09cc)',
      buttons: Array.from({ length: 18 }, () => ({ pressed: false, touched: false, value: 0 })),
      axes: [0, 0, 0, 0],
    });
    expect(resolveControllerMode(gamepad)).toEqual({ mode: 'standard', profileId: 'dualshock4' });
  });

  it('does not classify a different Sony product id as DualShock 4', () => {
    const gamepad = createStandardGamepad({
      id: 'Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)',
    });
    expect(resolveControllerMode(gamepad)).toEqual({ mode: 'standard', profileId: 'generic-standard' });
  });

  it('recognizes the physically verified Joy-Con Left id', () => {
    const gamepad = createStandardGamepad({
      id: 'Wireless Gamepad (STANDARD GAMEPAD Vendor: 057e Product: 2006)',
      buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })),
      axes: [0, 0],
    });
    expect(resolveControllerMode(gamepad)).toEqual({ mode: 'standard', profileId: 'joycon-left' });
  });

  it('recognizes the physically verified Joy-Con Right id', () => {
    const gamepad = createStandardGamepad({
      id: 'Wireless Gamepad (STANDARD GAMEPAD Vendor: 057e Product: 2007)',
      buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })),
      axes: [0, 0],
    });
    expect(resolveControllerMode(gamepad)).toEqual({ mode: 'standard', profileId: 'joycon-right' });
  });

  it('recognizes the physically verified combined Joy-Con id', () => {
    const gamepad = createStandardGamepad({
      id: 'Joy-Con L+R (STANDARD GAMEPAD Vendor: 057e Product: 200e)',
      buttons: Array.from({ length: 22 }, () => ({ pressed: false, touched: false, value: 0 })),
      axes: [0, 0, 0, 0],
    });
    expect(resolveControllerMode(gamepad)).toEqual({ mode: 'standard', profileId: 'joycon-pair' });
  });

  it('keeps a non-standard Joy-Con in raw mode', () => {
    const gamepad = createNonStandardGamepad({
      id: 'Wireless Gamepad (STANDARD GAMEPAD Vendor: 057e Product: 2006)',
    });
    expect(resolveControllerMode(gamepad)).toEqual({ mode: 'raw', profileId: 'raw' });
  });

  it('labels the verified extra DualShock 4 button as the touchpad click', () => {
    expect(dualShock4ButtonLabel(17)).toBe('Touchpad Click');
    expect(dualShock4ButtonLabel(16)).toBeUndefined();
  });

  it('overrides only physically verified Joy-Con Left buttons', () => {
    expect(joyConButtonLabel('joycon-left', 6)).toBe('ZL');
    expect(joyConButtonLabel('joycon-left', 8)).toBe('L');
    expect(joyConButtonLabel('joycon-left', 9)).toBe('Minus (-)');
    expect(joyConButtonLabel('joycon-left', 10)).toBe('Left Stick Click');
    expect(joyConButtonLabel('joycon-left', 16)).toBe('Capture');
    expect(joyConButtonLabel('joycon-left', 7)).toBeUndefined();
  });

  it('overrides only physically verified Joy-Con Right buttons', () => {
    expect(joyConButtonLabel('joycon-right', 7)).toBe('ZR');
    expect(joyConButtonLabel('joycon-right', 8)).toBe('R');
    expect(joyConButtonLabel('joycon-right', 9)).toBe('Plus (+)');
    expect(joyConButtonLabel('joycon-right', 10)).toBe('Right Stick Click');
    expect(joyConButtonLabel('joycon-right', 16)).toBe('Home');
    expect(joyConButtonLabel('joycon-right', 6)).toBeUndefined();
  });

  it('does not invent labels for the combined Joy-Con profile', () => {
    expect(joyConButtonLabel('joycon-pair', 17)).toBeUndefined();
    expect(joyConButtonLabel('joycon-pair', 21)).toBeUndefined();
  });

  it('maps Joy-Con Left axes 0 and 1 to the left stick only', () => {
    expect(joyConStickRoles('joycon-left')).toEqual({
      left: [0, 1],
      right: null,
    });
  });

  it('maps Joy-Con Right axes 0 and 1 to the right stick only', () => {
    expect(joyConStickRoles('joycon-right')).toEqual({
      left: null,
      right: [0, 1],
    });
  });

  it('keeps combined Joy-Con axes in the two-stick standard layout', () => {
    expect(joyConStickRoles('joycon-pair')).toEqual({
      left: [0, 1],
      right: [2, 3],
    });
  });

  it('provides neutral standard and raw labels', () => {
    expect(STANDARD_BUTTON_LABELS[6]).toBe('Left Trigger');
    expect(standardAxisRole(2)).toBe('right-x');
    expect(rawButtonLabel(3)).toBe('Button 3');
    expect(rawAxisLabel(2)).toBe('Axis 2');
  });
});
