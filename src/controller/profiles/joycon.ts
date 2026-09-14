import type { ControllerProfile } from '../core/types.js';

export type JoyConProfileId = 'joycon-left' | 'joycon-right' | 'joycon-pair';
export type StickAxisPair = readonly [number, number];
export interface JoyConStickRoles {
  left: StickAxisPair | null;
  right: StickAxisPair | null;
}

const JOYCON_IDS: Record<JoyConProfileId, RegExp> = {
  'joycon-left': /vendor:\s*057e\s+product:\s*2006/i,
  'joycon-right': /vendor:\s*057e\s+product:\s*2007/i,
  'joycon-pair': /vendor:\s*057e\s+product:\s*200e/i,
};

const JOYCON_BUTTON_LABELS: Record<Exclude<JoyConProfileId, 'joycon-pair'>, Readonly<Record<number, string>>> = {
  'joycon-left': Object.freeze({
    6: 'ZL',
    8: 'L',
    9: 'Minus (-)',
    10: 'Left Stick Click',
    16: 'Capture',
  }),
  'joycon-right': Object.freeze({
    7: 'ZR',
    8: 'R',
    9: 'Plus (+)',
    10: 'Right Stick Click',
    16: 'Home',
  }),
};

const JOYCON_STICK_ROLES: Readonly<Record<JoyConProfileId, JoyConStickRoles>> = Object.freeze({
  'joycon-left': Object.freeze({ left: [0, 1] as const, right: null }),
  'joycon-right': Object.freeze({ left: null, right: [0, 1] as const }),
  'joycon-pair': Object.freeze({ left: [0, 1] as const, right: [2, 3] as const }),
});

export function joyConButtonLabel(profileId: JoyConProfileId, index: number): string | undefined {
  if (profileId === 'joycon-pair') return undefined;
  return JOYCON_BUTTON_LABELS[profileId][index];
}

export function joyConStickRoles(profileId: JoyConProfileId): JoyConStickRoles {
  return JOYCON_STICK_ROLES[profileId];
}

function createJoyConProfile(id: JoyConProfileId): ControllerProfile {
  return {
    id,
    matches(gamepad) {
      return gamepad.mapping === 'standard' && JOYCON_IDS[id].test(gamepad.id);
    },
  };
}

export const joyConLeftProfile = createJoyConProfile('joycon-left');
export const joyConRightProfile = createJoyConProfile('joycon-right');
export const joyConPairProfile = createJoyConProfile('joycon-pair');
