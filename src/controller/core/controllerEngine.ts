import { resolveControllerMode } from '../mapping/resolver.js';
import { normalizeGamepad } from './normalize.js';
import type { ControllerSnapshot, GamepadProvider } from './types.js';

export interface ControllerEngineState {
  controllers: readonly ControllerSnapshot[];
  selectedIndex: number | null;
}

export class ControllerEngine {
  private state: ControllerEngineState = Object.freeze({ controllers: Object.freeze([]), selectedIndex: null });
  private listeners = new Set<(state: ControllerEngineState) => void>();
  private readonly unsubscribeProvider: () => void;

  constructor(private readonly provider: GamepadProvider) {
    this.unsubscribeProvider = provider.subscribe(() => this.scan());
  }

  scan(): ControllerEngineState {
    const controllers = this.provider.getGamepads()
      .filter((gamepad): gamepad is NonNullable<typeof gamepad> => Boolean(gamepad?.connected))
      .map((gamepad) => {
        const resolution = resolveControllerMode(gamepad);
        return normalizeGamepad(gamepad, resolution.profileId);
      })
      .sort((a, b) => a.identity.index - b.identity.index);

    const connectedIndices = new Set(controllers.map((controller) => controller.identity.index));
    let selectedIndex = this.state.selectedIndex;
    if (selectedIndex === null || !connectedIndices.has(selectedIndex)) {
      selectedIndex = controllers[0]?.identity.index ?? null;
    }

    this.state = Object.freeze({ controllers: Object.freeze(controllers), selectedIndex });
    this.emit();
    return this.state;
  }

  select(index: number): void {
    if (!this.state.controllers.some((controller) => controller.identity.index === index)) return;
    if (this.state.selectedIndex === index) return;
    this.state = Object.freeze({ ...this.state, selectedIndex: index });
    this.emit();
  }

  getState(): ControllerEngineState {
    return this.state;
  }

  subscribe(listener: (state: ControllerEngineState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  dispose(): void {
    this.unsubscribeProvider();
    this.listeners.clear();
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener(this.state));
  }
}
