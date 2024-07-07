import { describe, it, expect } from "vitest";

import { createMockBuilder } from "./index";

describe("ts-deep-mock-vitest", () => {
  describe("basic tests", () => {
    type MockType = {
      someService: {
        someSubService: {
          doSomething: Function;
          doSomeOtherThing: () => number;
          notAFunction: string;
        };
      };
    };

    it("should create a recursive proxy jest mock builder", () => {
      const builder = createMockBuilder<MockType>();
      const mock = builder.with.someService.someSubService.doSomething
        .mockReturnValue("some string")
        .build();

      expect(mock.someService.someSubService.doSomething()).toBe("some string");
      expect(mock.someService.someSubService.doSomething).toHaveBeenCalled();
    });

    it("should allow unset methods to be called", () => {
      const builder = createMockBuilder<MockType>();
      const mock = builder.build();
      expect(() => mock.someService.someSubService.doSomething()).not.toThrow();
      expect(mock.someService.someSubService.doSomething()).toBe(undefined);
    });

    it("should allow static primitive values to be set with the as method", () => {
      const builder = createMockBuilder<MockType>();
      const mock = builder.with.someService.someSubService.notAFunction
        .as("some value")
        .build();

      expect(mock.someService.someSubService.notAFunction).toBe("some value");
    });
  });

  describe("substitution", () => {
    interface SomeService {
      doSomething(): string;
      doAnotherThing(): string;
    }

    class MyClass {
      constructor(private someService: SomeService) {}
      doThing() {
        this.someService.doSomething();
      }
    }

    it("should act as a substitute for an interface", () => {
      const builder = createMockBuilder<SomeService>();
      const mock = builder.build();
      const object = new MyClass(mock);
      expect(object).toBeInstanceOf(MyClass);

      object.doThing();
      expect(mock.doSomething).toHaveBeenCalled();
    });

    interface AnotherService {
      getThing(): string;
      updateThing(): boolean;
    }

    type Services = {
      someService: SomeService;
      anotherService: AnotherService;
    };

    class MyOtherClass {
      constructor(private services: Services) {}

      doManyThings() {
        this.services.someService.doAnotherThing();
        this.services.anotherService.updateThing();
      }
    }

    it("should act as a substitute for multiple nested interfaces", () => {
      const builder = createMockBuilder<Services>();
      const mock = builder.build();
      const object = new MyOtherClass(mock);
      expect(object).toBeInstanceOf(MyOtherClass);

      object.doManyThings();
      expect(mock.someService.doAnotherThing).toHaveBeenCalled();
      expect(mock.anotherService.updateThing).toHaveBeenCalled();
    });
  });
});
