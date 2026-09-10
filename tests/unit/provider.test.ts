import { describe, expect, it, vi } from 'vitest';
import { MockGamepadProvider } from '../../src/controller/core/mockProvider';
import { createStandardGamepad } from '../fixtures/standardGamepad';

describe('MockGamepadProvider', () => {
  it('connects, updates, disconnects, and reconnects deterministic controllers', () => {
    const provider = new MockGamepadProvider();
    const listener = vi.fn();
    provider.subscribe(listener);
    provider.connect(createStandardGamepad({ index: 2 }));
    expect(provider.getGamepads()[2]?.connected).toBe(true);
    provider.update(2, { axes: [0.5, 0, 0, 0] });
    expect(provider.getGamepads()[2]?.axes[0]).toBe(0.5);
    provider.disconnect(2);
    expect(provider.getGamepads()[2]).toBeNull();
    provider.reconnect(createStandardGamepad({ index: 2, timestamp: 9 }));
    expect(provider.getGamepads()[2]?.timestamp).toBe(9);
    expect(listener).toHaveBeenCalledTimes(4);
  });
});
