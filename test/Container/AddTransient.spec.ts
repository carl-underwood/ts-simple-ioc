import { describe, expect, test } from "vitest";
import Container from "../../src/Container";
import TestService from "../TestService";

describe("Container", () => {
  describe("addTransient", () => {
    test("should throw when attempting to add a second service registration with the same name.", () => {
      const container = new Container();
      container.addTransient(TestService, () => new TestService());

      expect(() =>
        container.addTransient(TestService, () => new TestService()),
      ).toThrow(
        "Cannot add a transient TestService because " +
          "a transient service registration has already been added.",
      );
    });

    test("should throw when attempting to add a service registration after resolution has begun.", () => {
      const container = new Container().beginResolution();

      expect(() =>
        container.addTransient(TestService, () => new TestService()),
      ).toThrow(
        "Cannot add a transient TestService because resolution has begun.",
      );
    });
  });
});
