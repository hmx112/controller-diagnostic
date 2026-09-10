import type { ControllerProfile } from '../core/types.js';

const DS4_ID_PATTERNS = [
  /dualshock\s*4/i,
  /sony.+wireless controller/i,
  /sony interactive entertainment.+wireless controller/i,
  /(?:^|\b)054c(?:\b|:)/i,
];

export const dualShock4Profile: ControllerProfile = {
  id: 'dualshock4',
  matches(gamepad) {
    return gamepad.mapping === 'standard' && DS4_ID_PATTERNS.some((pattern) => pattern.test(gamepad.id));
  },
};
