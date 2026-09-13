import type { ControllerProfile } from '../core/types.js';

const DS4_ID_PATTERNS = [
  /dualshock\s*4/i,
  /vendor:\s*054c\s+product:\s*09cc/i,
];

export function dualShock4ButtonLabel(index: number): string | undefined {
  return index === 17 ? 'Touchpad Click' : undefined;
}

export const dualShock4Profile: ControllerProfile = {
  id: 'dualshock4',
  matches(gamepad) {
    return gamepad.mapping === 'standard' && DS4_ID_PATTERNS.some((pattern) => pattern.test(gamepad.id));
  },
};
