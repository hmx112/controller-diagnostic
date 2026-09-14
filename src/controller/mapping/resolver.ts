import type { GamepadLike } from '../core/types.js';
import { dualShock4Profile } from '../profiles/dualshock4.js';
import { joyConLeftProfile, joyConPairProfile, joyConRightProfile, type JoyConProfileId } from '../profiles/joycon.js';

export type ControllerProfileId = 'generic-standard' | 'dualshock4' | JoyConProfileId | 'raw';

export interface ControllerModeResolution {
  mode: 'standard' | 'raw';
  profileId: ControllerProfileId;
}

export function resolveControllerMode(gamepad: GamepadLike): ControllerModeResolution {
  if (gamepad.mapping !== 'standard') {
    return { mode: 'raw', profileId: 'raw' };
  }

  if (dualShock4Profile.matches(gamepad)) {
    return { mode: 'standard', profileId: 'dualshock4' };
  }

  if (joyConLeftProfile.matches(gamepad)) {
    return { mode: 'standard', profileId: 'joycon-left' };
  }

  if (joyConRightProfile.matches(gamepad)) {
    return { mode: 'standard', profileId: 'joycon-right' };
  }

  if (joyConPairProfile.matches(gamepad)) {
    return { mode: 'standard', profileId: 'joycon-pair' };
  }

  return { mode: 'standard', profileId: 'generic-standard' };
}
