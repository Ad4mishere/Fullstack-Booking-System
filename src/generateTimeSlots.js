import { db } from "./db.js";

export function generateTimeSlots(daysAhead = 10) {
  const today = new Date();

  const insertSlot = db.prepare(`
    INSERT OR IGNORE INTO time_slots (date, start_time)
    VALUES (?, ?)
  `);

  for (let i = 0; i < daysAhead; i++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + i);

    const dayOfWeek = currentDate.getDay();

    
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const dateString = currentDate.toISOString().split("T")[0];

    let hour = 8;
    let minute = 0;

    while (hour < 17) {
      const timeString = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

      insertSlot.run(dateString, timeString);

      minute += 30;
      if (minute === 60) {
        minute = 0;
        hour++;
      }
    }
  }
}
