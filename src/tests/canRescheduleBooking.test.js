import { describe, it, expect } from "vitest";
import { canRescheduleBooking } from "../utils/bookingRules.js";

describe("canRescheduleBooking", () => {
  it("allows rescheduling to a different free slot", () => {
    const oldSlot = { id: 1, is_booked: 1 };
    const newSlot = { id: 2, is_booked: 0 };

    expect(canRescheduleBooking(oldSlot, newSlot)).toBe(true);
  });

  it("prevents rescheduling to the same slot", () => {
    const slot = { id: 1, is_booked: 1 };

    expect(canRescheduleBooking(slot, slot)).toBe(false);
  });

  it("prevents rescheduling to a booked slot", () => {
    const oldSlot = { id: 1, is_booked: 1 };
    const newSlot = { id: 2, is_booked: 1 };

    expect(canRescheduleBooking(oldSlot, newSlot)).toBe(false);
  });

  it("returns false if old slot is missing", () => {
    const newSlot = { id: 2, is_booked: 0 };

    expect(canRescheduleBooking(null, newSlot)).toBe(false);
  });

  it("returns false if new slot is missing", () => {
    const oldSlot = { id: 1, is_booked: 1 };

    expect(canRescheduleBooking(oldSlot, null)).toBe(false);
  });
});