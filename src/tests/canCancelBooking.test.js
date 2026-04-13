import { describe, it, expect } from "vitest";
import { canCancelBooking } from "../utils/bookingRules.js";

describe("canCancelBooking", () => {
  it("returns true when booking has a numeric id", () => {
    const booking = { id: 1 };
    expect(canCancelBooking(booking)).toBe(true);
  });

  it("returns false when booking is null", () => {
    expect(canCancelBooking(null)).toBe(false);
  });

  it("returns false when id is missing", () => {
    const booking = {};
    expect(canCancelBooking(booking)).toBe(false);
  });

  it("returns false when id is not a number", () => {
    const booking = { id: "1" };
    expect(canCancelBooking(booking)).toBe(false);
  });
});
