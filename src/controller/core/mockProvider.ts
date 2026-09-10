import type { GamepadLike, GamepadProvider } from './types.js';

export type GamepadPatch = Partial<Omit<GamepadLike, 'index'>>;

export class MockGamepadProvider implements GamepadProvider {
  private gamepads = new Map<number, GamepadLike | null>();
  private listeners = new Set<() => void>();

  getGamepads(): readonly (GamepadLike | null)[] {
    if (this.gamepads.size === 0) return [];
    const maxIndex = Math.max(...this.gamepads.keys());
    return Array.from({ length: maxIndex + 1 }, (_, index) => this.gamepads.get(index) ?? null);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  connect(gamepad: GamepadLike): void {
    this.gamepads.set(gamepad.index, this.clone(gamepad, { connected: true }));
    this.emit();
  }

  update(index: number, patch: GamepadPatch): void {
    const current = this.gamepads.get(index);
    if (!current) return;
    this.gamepads.set(index, this.clone(current, patch));
    this.emit();
  }

  disconnect(index: number): void {
    const current = this.gamepads.get(index);
    if (!current) return;
    this.gamepads.set(index, null);
    this.emit();
  }

  reconnect(gamepad: GamepadLike): void {
    this.connect(gamepad);
  }

  private clone(gamepad: GamepadLike, patch: GamepadPatch = {}): GamepadLike {
    const buttons = patch.buttons ?? gamepad.buttons;
    const axes = patch.axes ?? gamepad.axes;
    return {
      ...gamepad,
      ...patch,
      index: gamepad.index,
      buttons: buttons.map((button) => ({ ...button })),
      axes: [...axes],
    };
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener());
  }
}
