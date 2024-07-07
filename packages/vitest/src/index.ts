import { Mock, vi } from "vitest";

type AsOverride<T, R> = { as: (value: T) => R };

type OverrideMethodReturns<T, R> = {
  [P in keyof T]: T[P] extends (...args: infer Args) => any
    ? (...args: Args) => R
    : T[P];
};

type RecursiveWith<T, TT = T> = Required<{
  [P in keyof T]: T[P] extends Function
    ? OverrideMethodReturns<Mock, MockBuilder<TT>>
    : RecursiveWith<T[P], TT> &
        ((value: T[P]) => MockBuilder<TT>) &
        AsOverride<T[P], MockBuilder<TT>>;
}>;

type RecursiveMock<T> = {
  [P in keyof T]: T[P] extends Function ? T[P] & Mock : RecursiveMock<T[P]>;
};

type MockBuilder<T> = {
  with: RecursiveWith<T>;
  build(): RecursiveMock<T>;
};

type ProxyCallbackOptions = {
  path: string[];
  args: unknown[];
};

type ProxyCallback = (opts: ProxyCallbackOptions) => unknown;

const getFromPath = (object: Record<string, any>, path: string[]): any => {
  const key = path.shift() as keyof typeof object;
  const value = object?.[key];
  if (!path.length) {
    return value;
  }
  return getFromPath(value, path);
};

const getMock = (mocks: Record<string, any>, key: string) => {
  for (const [mockKey, value] of Object.entries(mocks)) {
    if (key === mockKey) {
      return value;
    }

    if (key.startsWith(mockKey)) {
      const innerPath = key.replace(mockKey, "").split(".").filter(Boolean);
      return getFromPath(value, innerPath);
    }
  }
};

const noop = () => {};

function createInnerProxy(
  callback: ProxyCallback,
  path: string[],
  overrides?: Record<string, any>
) {
  const proxy: unknown = new Proxy(noop, {
    get(_obj, key) {
      if (typeof key !== "string" || key === "then") {
        return undefined;
      }

      const overrideKey = [...path, key].join(".");

      if (overrides) {
        const mock = getMock(overrides, overrideKey);

        if (mock) {
          return mock;
        }
      }

      return createInnerProxy(callback, [...path, key], overrides);
    },
    apply(_1, _2, args) {
      const isApply = path[path.length - 1] === "apply";
      return callback({
        args: isApply ? (args.length >= 2 ? args[1] : []) : args,
        path: isApply ? path.slice(0, -1) : path,
      });
    },
  });

  return proxy;
}

const createRecursiveProxy = (
  callback: ProxyCallback,
  path: string[] = [],
  overrides?: Record<string, any>
) => createInnerProxy(callback, path, overrides);

const createFlatProxy = <TFaux>(
  callback: (path: keyof TFaux & string) => any,
  overrides?: Record<string, any>
): TFaux => {
  return new Proxy(noop, {
    get(_obj, name) {
      if (typeof name !== "string" || name === "then") {
        return undefined;
      }

      if (overrides && name in overrides) {
        return overrides[name];
      }

      return callback(name as any);
    },
  }) as TFaux;
};

class Builder<T extends Record<string | symbol, any>>
  implements MockBuilder<T>
{
  private readonly mocks = {} as Record<string, any>;

  constructor() {}

  with = createFlatProxy<RecursiveWith<T>>((key) => {
    return createRecursiveProxy(
      ({ path, args }) => {
        const key = path.slice(0, path.length - 1).join(".");
        const lastPathSegment = path[path.length - 1];

        if (lastPathSegment === "as") {
          this.mocks[key] = args[0];
          return this;
        }

        const mock = vi.fn();

        if (lastPathSegment in mock) {
          this.mocks[key] = mock;
          const mockProp = mock[lastPathSegment as keyof typeof mock];

          if (typeof mockProp === "function") {
            (mockProp as any)(...args);
          }

          return this;
        }

        return this;
      },
      [key]
    );
  });

  build() {
    return createFlatProxy((key) => {
      return createRecursiveProxy(
        ({ path, args }) => {
          const key = path.join(".");

          if (key in this.mocks) {
            return this.mocks[key](...args);
          }

          const mock = getMock(this.mocks, key);

          if (mock) {
            return mock(...args);
          }

          this.mocks[key] = vi.fn();
          return this.mocks[key](...args);
        },
        [key],
        this.mocks
      );
    }, this.mocks) as RecursiveMock<T>;
  }
}

const createMockBuilder = <
  T extends Record<string | symbol, any>
>(): MockBuilder<T> => new Builder<T>();

export { createMockBuilder };
export type { MockBuilder };
