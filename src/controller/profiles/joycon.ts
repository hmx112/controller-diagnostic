import type { ControllerProfile } from '../core/types.js';

export type JoyConProfileId = 'joycon-left' | 'joycon-right' | 'joycon-pair';

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

export function joyConButtonLabel(profileId: JoyConProfileId, index: number): string | undefined {
  if (profileId === 'joycon-pair') return undefined;
  return JOYCON_BUTTON_LABELS[profileId][index];
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
