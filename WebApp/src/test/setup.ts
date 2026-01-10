import { beforeAll, afterAll, vi } from 'vitest';

// Mock console methods to reduce test noise
beforeAll(() => {
    globalThis.console = {
        ...console,
        log: vi.fn(),
        error: console.error, // Keep errors visible
        warn: console.warn,   // Keep warnings visible
        info: vi.fn(),
        debug: vi.fn(),
    };
});

afterAll(() => {
    vi.restoreAllMocks();
});
