import { Mock, vi } from "vitest";

import { Builder, MockBuilder } from "ts-deep-mock-core";

const createMockBuilder = <T extends Record<string | symbol, any>>(): Builder<
  T,
  Mock
> => new Builder<T, Mock>(vi.fn);

export { createMockBuilder };
export type { MockBuilder };
