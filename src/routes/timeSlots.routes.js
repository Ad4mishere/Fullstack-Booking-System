import express from "express";
import { db } from "../db.js";

const router = express.Router();

router.get("/", (req, res) => {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const currentTime = now.toTimeString().slice(0, 5);

  const slots = db.prepare(`
    SELECT id, date, start_time
    FROM time_slots
    WHERE is_booked = 0
      AND (
        date > ?
        OR (date = ? AND start_time > ?)
      )
    ORDER BY date, start_time
  `).all(today, today, currentTime);

  res.status(200).json(slots);
});

export default router;
