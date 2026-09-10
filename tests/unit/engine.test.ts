import { describe, expect, it } from 'vitest';
import { ControllerEngine } from '../../src/controller/core/controllerEngine';
import { MockGamepadProvider } from '../../src/controller/core/mockProvider';
import { createMultiControllerFixtures } from '../fixtures/multiController';
import { createNonStandardGamepad } from '../fixtures/nonStandard';

describe('ControllerEngine', () => {
  it('selects the first controller, supports explicit selection, and falls back after disconnect', () => {
    const provider = new MockGamepadProvider();
    const engine = new ControllerEngine(provider);
    const [first, second] = createMultiControllerFixtures();
    provider.connect(first);
    engine.scan();
    expect(engine.getState().selectedIndex).toBe(first.index);
    provider.connect(second);
    engine.scan();
    expect(engine.getState().controllers).toHaveLength(2);
    engine.select(second.index);
    expect(engine.getState().selectedIndex).toBe(second.index);
    provider.disconnect(second.index);
    engine.scan();
    expect(engine.getState().selectedIndex).toBe(first.index);
  });

  it('keeps raw mapping when a non-standard controller reconnects', () => {
    const provider = new MockGamepadProvider();
    const engine = new ControllerEngine(provider);
    const raw = createNonStandardGamepad({ index: 4 });
    provider.connect(raw);
    engine.scan();
    expect(engine.getState().controllers[0]?.capabilities.standardMapping).toBe(false);
    provider.disconnect(4);
    provider.reconnect(raw);
    engine.scan();
    expect(engine.getState().controllers[0]?.capabilities.profileId).toBe('raw');
  });
});
