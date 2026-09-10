import type { ControllerSnapshot, GamepadLike } from './types.js';

export function normalizeGamepad(gamepad: GamepadLike, profileId: string): ControllerSnapshot {
  const buttons = gamepad.buttons.map((button, index) => Object.freeze({
    index,
    pressed: Boolean(button.pressed),
    touched: Boolean(button.touched),
    value: Number.isFinite(button.value) ? button.value : 0,
  }));

  const axes = gamepad.axes.map((value, index) => Object.freeze({
    index,
    value: Number.isFinite(value) ? value : 0,
  }));

  return Object.freeze({
    identity: Object.freeze({
      id: gamepad.id,
      index: gamepad.index,
      connected: gamepad.connected,
      mapping: gamepad.mapping,
      timestamp: gamepad.timestamp,
    }),
    capabilities: Object.freeze({
      buttonCount: buttons.length,
      axisCount: axes.length,
      standardMapping: gamepad.mapping === 'standard',
      profileId,
    }),
    buttons: Object.freeze(buttons),
    axes: Object.freeze(axes),
  });
}
