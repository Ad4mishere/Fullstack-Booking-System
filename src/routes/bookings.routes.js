import express from "express";
import crypto from "crypto";
import { db } from "../db.js";

const router = express.Router();

router.post("/", (req, res) => {
  const { timeSlotId } = req.body;

  if (!timeSlotId) {
    return res.status(400).json({ error: "timeSlotId is required" });
  }

  const slot = db.prepare(`
    SELECT id, is_booked
    FROM time_slots
    WHERE id = ?
  `).get(timeSlotId);

  if (!slot) {
    return res.status(404).json({ error: "Time slot not found" });
  }

  if (slot.is_booked) {
    return res.status(400).json({ error: "Time slot already booked" });
  }

  const orderNumber = `ORD-${crypto.randomUUID()
    .slice(0, 8)
    .toUpperCase()}`;

  const book = db.transaction(() => {
    db.prepare(`
      UPDATE time_slots
      SET is_booked = 1
      WHERE id = ?
    `).run(timeSlotId);

    db.prepare(`
      INSERT INTO bookings (time_slot_id, order_number)
      VALUES (?, ?)
    `).run(timeSlotId, orderNumber);
  });

  book();

  res.status(201).json({ orderNumber });
});

router.delete("/:orderNumber", (req, res) => {
  const { orderNumber } = req.params;


  const booking = db.prepare(`
    SELECT id, time_slot_id
    FROM bookings
    WHERE order_number = ?
  `).get(orderNumber);


  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }


  const cancel = db.transaction(() => {
    db.prepare(`
      DELETE FROM bookings
      WHERE id = ?
    `).run(booking.id);

    db.prepare(`
      UPDATE time_slots
      SET is_booked = 0
      WHERE id = ?
    `).run(booking.time_slot_id);
  });

  cancel();


  res.status(200).json({ message: "Booking cancelled" });
});


router.put("/:orderNumber", (req, res) => {
  const { orderNumber } = req.params;
  const { newTimeSlotId } = req.body;


  if (!newTimeSlotId) {
    return res.status(400).json({ error: "newTimeSlotId is required" });
  }


  const booking = db.prepare(`
    SELECT id, time_slot_id
    FROM bookings
    WHERE order_number = ?
  `).get(orderNumber);

  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }


  const newSlot = db.prepare(`
    SELECT id, is_booked
    FROM time_slots
    WHERE id = ?
  `).get(newTimeSlotId);

  if (!newSlot) {
    return res.status(404).json({ error: "New time slot not found" });
  }

  if (newSlot.is_booked) {
    return res.status(400).json({ error: "New time slot is already booked" });
  }


  const rebook = db.transaction(() => {

    db.prepare(`
      UPDATE time_slots
      SET is_booked = 0
      WHERE id = ?
    `).run(booking.time_slot_id);


    db.prepare(`
      UPDATE time_slots
      SET is_booked = 1
      WHERE id = ?
    `).run(newTimeSlotId);



    db.prepare(`
      UPDATE bookings
      SET time_slot_id = ?
      WHERE id = ?
    `).run(newTimeSlotId, booking.id);
  });

  rebook();

  res.status(200).json({ message: "Booking updated" });
});


export default router;