import type { GamepadLike, GamepadProvider } from './types.js';

export class BrowserGamepadProvider implements GamepadProvider {
  private listeners = new Set<() => void>();
  private readonly windowRef: Window;
  private readonly navigatorRef: Navigator;
  private readonly handleConnectionChange = () => this.emit();

  constructor(windowRef: Window = window, navigatorRef: Navigator = navigator) {
    this.windowRef = windowRef;
    this.navigatorRef = navigatorRef;
    this.windowRef.addEventListener('gamepadconnected', this.handleConnectionChange);
    this.windowRef.addEventListener('gamepaddisconnected', this.handleConnectionChange);
  }

  getGamepads(): readonly (GamepadLike | null)[] {
    if (typeof this.navigatorRef.getGamepads !== 'function') return [];
    return Array.from(this.navigatorRef.getGamepads(), (gamepad) => gamepad as GamepadLike | null);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  dispose(): void {
    this.windowRef.removeEventListener('gamepadconnected', this.handleConnectionChange);
    this.windowRef.removeEventListener('gamepaddisconnected', this.handleConnectionChange);
    this.listeners.clear();
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener());
  }
}
