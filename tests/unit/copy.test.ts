import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageSource = readFileSync(new URL('../../src/pages/index.astro', import.meta.url), 'utf8');
const runtimeSource = readFileSync(new URL('../../src/controller/ui/runtime.ts', import.meta.url), 'utf8');
const combined = `${pageSource}\n${runtimeSource}`;

describe('diagnostic claim language', () => {
  it('includes the browser-observed measurement disclaimer', () => {
    expect(combined).toContain('Results reflect input values exposed by your browser and operating system');
  });

  it('does not make definitive hardware-failure claims', () => {
    expect(combined).not.toContain('Your controller has stick drift');
    expect(combined).not.toContain('Your stick is broken');
    expect(combined).not.toContain('Your controller latency is');
  });
});
