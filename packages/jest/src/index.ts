import { Builder, MockBuilder } from "ts-deep-mock-core";

const createMockBuilder = <T extends Record<string | symbol, any>>(): Builder<
  T,
  jest.Mock
> => new Builder<T, jest.Mock>(jest.fn);

export { createMockBuilder };
export type { MockBuilder };
