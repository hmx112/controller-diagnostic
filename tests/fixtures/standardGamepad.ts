import type { GamepadButtonLike, GamepadLike } from '../../src/controller/core/types.js';

export type GamepadOverrides = Partial<Omit<GamepadLike, 'buttons' | 'axes'>> & {
  buttons?: readonly GamepadButtonLike[];
  axes?: readonly number[];
};

const releasedButton = (): GamepadButtonLike => ({
  pressed: false,
  touched: false,
  value: 0,
});

export function createStandardGamepad(overrides: GamepadOverrides = {}): GamepadLike {
  return {
    id: 'Synthetic Standard Controller',
    index: 0,
    connected: true,
    mapping: 'standard',
    timestamp: 1,
    buttons: Array.from({ length: 17 }, releasedButton),
    axes: [0, 0, 0, 0],
    ...overrides,
  };
}
