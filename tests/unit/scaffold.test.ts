import { describe, expect, it } from 'vitest';
import { createStandardGamepad } from '../fixtures/standardGamepad';

describe('test harness', () => {
  it('creates a deterministic synthetic standard controller', () => {
    const gamepad = createStandardGamepad();
    expect(gamepad.mapping).toBe('standard');
    expect(gamepad.buttons).toHaveLength(17);
    expect(gamepad.axes).toHaveLength(4);
  });
});
