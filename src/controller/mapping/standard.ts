export const STANDARD_BUTTON_LABELS = Object.freeze([
  'Face Bottom',
  'Face Right',
  'Face Left',
  'Face Top',
  'Left Shoulder',
  'Right Shoulder',
  'Left Trigger',
  'Right Trigger',
  'Back / Select',
  'Start',
  'Left Stick Press',
  'Right Stick Press',
  'D-pad Up',
  'D-pad Down',
  'D-pad Left',
  'D-pad Right',
  'Home / Meta',
] as const);

export type StandardAxisRole = 'left-x' | 'left-y' | 'right-x' | 'right-y' | null;

export function standardAxisRole(index: number): StandardAxisRole {
  return (['left-x', 'left-y', 'right-x', 'right-y'] as const)[index] ?? null;
}
