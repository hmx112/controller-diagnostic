import type { GamepadLike } from '../../src/controller/core/types.js';
import { createStandardGamepad } from './standardGamepad.js';

export function createMultiControllerFixtures(): readonly [GamepadLike, GamepadLike] {
  return [
    createStandardGamepad({ id: 'Synthetic Controller A', index: 0, timestamp: 1 }),
    createStandardGamepad({ id: 'Synthetic Controller B', index: 1, timestamp: 1 }),
  ];
}
