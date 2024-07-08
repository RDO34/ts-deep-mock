# ts-deep-mock

Automatically generate test mocks based on types.

## About

Inspired by `@fluffy-spoon/substitute` and `jest-mock-extended`, this package aims to reduce boilerplate further for deeply nested structured mocks while making use of existing `jest`/`vitest` interfaces.

Example:

```ts
// model.ts
type Services = {
  someService: {
    someNestedService: {
      doSomething: Function;
      doSomeOtherThing: () => number;
      notAFunction: string;
    };
  };
};

// myFunction.ts
const myFunction = (services: Services) => {
  services.someService.someNestedService.doSomething();
  services.someService.someNestedService.soSomeOtherThing();
  return services.someService.someNestedService.notAFunction;
};

// test.ts
import { createMockBuilder } from "ts-deep-mock-jest";

it("should call some service", () => {
  const builder = createMockBuilder<MockType>();
  const mock = builder.with.someService.someNestedService.doSomething
    .mockReturnValue("some string")
    .with.someService.someNestedService.notAFunction.as("some value")
    .build();

  const result = myFunction(mock);

  expect(result).toBe("some value");
  expect(mock.someService.someNestedService.doSomething()).toBe("some string");
  expect(mock.someService.someNestedService.doSomething).toHaveBeenCalled();
});
```

## Install

### Jest

```
npm install --save-dev jest ts-deep-mock-jest
```

### Vitest

```
npm install --save-dev vitest ts-deep-mock-vitest
```
