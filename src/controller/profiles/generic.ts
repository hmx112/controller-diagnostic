import type { ControllerProfile } from '../core/types.js';

export const genericStandardProfile: ControllerProfile = {
  id: 'generic-standard',
  matches(gamepad) {
    return gamepad.mapping === 'standard';
  },
};
