import type { GamepadLike } from '../core/types.js';
import { dualShock4Profile } from '../profiles/dualshock4.js';

export interface ControllerModeResolution {
  mode: 'standard' | 'raw';
  profileId: 'generic-standard' | 'dualshock4' | 'raw';
}

export function resolveControllerMode(gamepad: GamepadLike): ControllerModeResolution {
  if (gamepad.mapping !== 'standard') {
    return { mode: 'raw', profileId: 'raw' };
  }

  if (dualShock4Profile.matches(gamepad)) {
    return { mode: 'standard', profileId: 'dualshock4' };
  }

  return { mode: 'standard', profileId: 'generic-standard' };
}
