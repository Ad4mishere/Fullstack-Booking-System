export function canBookTimeSlot(slot) {
  if (!slot || typeof slot.is_booked !== "number") {
    return false;
  }

  return slot.is_booked === 0;
}

export function canCancelBooking(booking) {
  if (!booking || typeof booking.id !== "number") {
    return false;
  }

  return true;
}

export function canRescheduleBooking(oldSlot, newSlot) {
  if (!oldSlot || !newSlot) {
    return false;
  }

  if (oldSlot.id === newSlot.id) {
    return false;
  }

  if (newSlot.is_booked !== 0) {
    return false;
  }

  return true;
}
