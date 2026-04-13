import { describe, it, expect } from "vitest";
import { canBookTimeSlot } from "../utils/bookingRules.js";

describe("canBookTimeSlot", () => {
  it("allows booking when slot is not booked", () => {
    const slot = { is_booked: 0 };
    expect(canBookTimeSlot(slot)).toBe(true);
  });

  it("prevents booking when slot is already booked", () => {
    const slot = { is_booked: 1 };
    expect(canBookTimeSlot(slot)).toBe(false);
  });

  it("returns false if slot is null", () => {
    expect(canBookTimeSlot(null)).toBe(false);
  });

  it("returns false if is_booked is missing", () => {
    const slot = {};
    expect(canBookTimeSlot(slot)).toBe(false);
  });

  it("returns false if is_booked is not a number", () => {
    const slot = { is_booked: "0" };
    expect(canBookTimeSlot(slot)).toBe(false);
  });
});
