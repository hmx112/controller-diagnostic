import type { GamepadLike } from '../../src/controller/core/types.js';
import type { GamepadOverrides } from './standardGamepad.js';

export function createNonStandardGamepad(overrides: GamepadOverrides = {}): GamepadLike {
  return {
    id: 'Synthetic Raw Controller',
    index: 1,
    connected: true,
    mapping: '',
    timestamp: 1,
    buttons: [{ pressed: true, touched: true, value: 1 }],
    axes: [0, 0],
    ...overrides,
  };
}
