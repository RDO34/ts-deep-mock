# ts-deep-mock

Generate mocks based on types.

Example:

```ts
import { createMockBuilder } from "@ts-deep-mock/jest";

type Services = {
  someService: {
    someSubService: {
      doSomething: Function;
      doSomeOtherThing: () => number;
      notAFunction: string;
    };
  };
};

const myFunction = (services: Services) => {
  services.someService.someSubService.doSomething();
  services.someService.someSubService.soSomeOtherThing();
};

it("should should call some service", () => {
  const builder = createMockBuilder<MockType>();
  const mock = builder.with.someService.someSubService.doSomething
    .mockReturnValue("some string")
    .build();

  myFunction(mock);

  expect(mock.someService.someSubService.doSomething()).toBe("some string");
  expect(mock.someService.someSubService.doSomething).toHaveBeenCalled();
});
```
