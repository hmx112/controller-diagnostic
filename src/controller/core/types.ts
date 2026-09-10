export interface GamepadButtonLike {
  pressed: boolean;
  touched: boolean;
  value: number;
}

export interface GamepadLike {
  id: string;
  index: number;
  connected: boolean;
  mapping: string;
  timestamp: number;
  buttons: readonly GamepadButtonLike[];
  axes: readonly number[];
}

export interface ControllerSnapshot {
  identity: {
    id: string;
    index: number;
    connected: boolean;
    mapping: string;
    timestamp: number;
  };
  capabilities: {
    buttonCount: number;
    axisCount: number;
    standardMapping: boolean;
    profileId: string;
  };
  buttons: ReadonlyArray<{
    index: number;
    pressed: boolean;
    touched: boolean;
    value: number;
  }>;
  axes: ReadonlyArray<{
    index: number;
    value: number;
  }>;
}

export interface GamepadProvider {
  getGamepads(): readonly (GamepadLike | null)[];
  subscribe(listener: () => void): () => void;
}

export interface ControllerProfile {
  id: string;
  matches(gamepad: GamepadLike): boolean;
}
