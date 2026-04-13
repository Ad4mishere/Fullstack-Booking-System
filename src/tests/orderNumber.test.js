import { describe, it, expect } from "vitest";
import { generateOrderNumber } from "../utils/orderNumber.js";

describe("generateOrderNumber", () => {
  it("returns a string starting with ORD-", () => {
    const result = generateOrderNumber();
    expect(result.startsWith("ORD-")).toBe(true);
  });

  it("returns different values on multiple calls", () => {
    const first = generateOrderNumber();
    const second = generateOrderNumber();

    expect(first).not.toBe(second);
  });

  it("returns a string with correct length", () => {
    const result = generateOrderNumber();
    expect(result.length).toBeGreaterThan(6);
  });
});
it("contains only uppercase letters and numbers after prefix", () => {
  const result = generateOrderNumber();
  const suffix = result.replace("ORD-", "");
  expect(suffix).toMatch(/^[A-Z0-9]+$/);
});

it("always starts with ORD-", () => {
  for (let i = 0; i < 10; i++) {
    expect(generateOrderNumber().startsWith("ORD-")).toBe(true);
  }
});

