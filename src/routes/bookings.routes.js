import express from "express";
import crypto from "crypto";
import { supabase } from "../supabaseClient.js";
import { z } from "zod";

const router = express.Router();

/* =======================
   CREATE BOOKING
======================= */

const createBookingSchema = z.object({
  timeSlotId: z.number()
});


router.post("/", async (req, res) => {
  const parsed = createBookingSchema.safeParse(req.body);

if (!parsed.success) {
  return res.status(400).json({ error: "Invalid input" });
}

const { timeSlotId } = parsed.data;

  const userId = req.user.id;

  // Hämta slot
  const { data: slot, error: slotError } = await supabase
    .from("time_slots")
    .select("id, is_booked")
    .eq("id", timeSlotId)
    .single();

  if (slotError || !slot) {
    return res.status(404).json({ error: "Time slot not found" });
  }

  const orderNumber = `ORD-${crypto.randomUUID()
    .slice(0, 8)
    .toUpperCase()}`;

  /* 🔥 RACE CONDITION FIX */
  const { data: updatedSlot, error: updateError } = await supabase
    .from("time_slots")
    .update({ is_booked: true })
    .eq("id", timeSlotId)
    .eq("is_booked", false)
    .select();

  if (updateError) {
    return res.status(500).json(updateError);
  }

  // Om ingen rad uppdaterades → redan bokad
  if (!updatedSlot || updatedSlot.length === 0) {
    return res.status(400).json({ error: "Time slot already booked" });
  }

  // Skapa booking
  const { error: insertError } = await supabase
    .from("bookings")
    .insert({
      time_slot_id: timeSlotId,
      order_number: orderNumber,
      user_id: userId
    });

  if (insertError) {
    return res.status(500).json(insertError);
  }

  res.status(201).json({ orderNumber });
});


/* =======================
   CANCEL BOOKING
======================= */
router.delete("/:orderNumber", async (req, res) => {
  const { orderNumber } = req.params;

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("order_number", orderNumber)
    .single();

  if (error || !booking) {
    return res.status(404).json({ error: "Booking not found" });
  }

  // 🔥 ACCESS CONTROL
  if (booking.user_id !== req.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  await supabase
    .from("bookings")
    .delete()
    .eq("id", booking.id);

  await supabase
    .from("time_slots")
    .update({ is_booked: false })
    .eq("id", booking.time_slot_id);

  res.status(200).json({ message: "Booking cancelled" });
});


/* =======================
   UPDATE BOOKING
======================= */

const updateBookingSchema = z.object({
  newTimeSlotId: z.number()
});

router.put("/:orderNumber", async (req, res) => {
  const { orderNumber } = req.params;
  const parsed = updateBookingSchema.safeParse(req.body);

if (!parsed.success) {
  return res.status(400).json({ error: "Invalid input" });
}

const { newTimeSlotId } = parsed.data;

  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("order_number", orderNumber)
    .single();

  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }

  // 🔥 ACCESS CONTROL
  if (booking.user_id !== req.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { data: newSlot } = await supabase
    .from("time_slots")
    .select("*")
    .eq("id", newTimeSlotId)
    .single();

  if (!newSlot) {
    return res.status(404).json({ error: "New time slot not found" });
  }

  if (newSlot.is_booked) {
    return res.status(400).json({ error: "New time slot is already booked" });
  }

  // Frigör gamla
  await supabase
    .from("time_slots")
    .update({ is_booked: false })
    .eq("id", booking.time_slot_id);

  // 🔥 (kan också race-fixas här men ej kritiskt nu)
  await supabase
    .from("time_slots")
    .update({ is_booked: true })
    .eq("id", newTimeSlotId);

  await supabase
    .from("bookings")
    .update({ time_slot_id: newTimeSlotId })
    .eq("id", booking.id);

  res.status(200).json({ message: "Booking updated" });
});

export default router;