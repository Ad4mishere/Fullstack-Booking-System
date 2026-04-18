import { supabase } from "./supabaseClient.js";
import { logger } from "./utils/logger.js"; // ADDED

export async function generateTimeSlots(daysAhead = 10) {
  const today = new Date();

  const slots = [];

  for (let i = 0; i < daysAhead; i++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + i);

    const dayOfWeek = currentDate.getDay();

    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const dateString = currentDate.toISOString().split("T")[0];

    let hour = 8;
    let minute = 0;

    while (hour < 17) {
      const timeString = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

      slots.push({
        date: dateString,
        start_time: timeString,
        is_booked: false
      });

      minute += 30;
      if (minute === 60) {
        minute = 0;
        hour++;
      }
    }
  }

  // Insert ALL slots at once
  const { error } = await supabase
    .from("time_slots")
    .insert(slots);

  if (error) {
    logger.error({
      event: "seed_time_slots_failed",
      error
    }); // CHANGED
  } else {
    logger.info({
      event: "seed_time_slots_success",
      count: slots.length
    }); // CHANGED
  }
}