import express from "express";
import crypto from "crypto";
import { supabase } from "../supabaseClient.js";
import { z } from "zod";

const router = express.Router();

const orderNumberSchema = z.object({
  orderNumber: z.string().regex(/^ORD-[A-Z0-9]+$/)
});

/* =======================
   CREATE BOOKING
======================= */

const createBookingSchema = z.object({
  timeSlotId: z.number().int().positive()
});

router.post("/", async (req, res) => {
  //  1. Validera input
  const parsed = createBookingSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const { timeSlotId } = parsed.data;
  const userId = req.user.id;

  //  2. Hämta slot
  const { data: slot, error: slotError } = await supabase
    .from("time_slots")
    .select("id, is_booked, date, start_time")
    .eq("id", timeSlotId)
    .single();

  if (slotError || !slot) {
    return res.status(404).json({ error: "Time slot not found" });
  }

  // 3. blocka gamla tider
  const slotDateTime = new Date(`${slot.date}T${slot.start_time}`);
  if (slotDateTime < new Date()) {
    return res.status(400).json({ error: "Cannot book past time" });
  }

  // 4. Generera ordernummer
  const orderNumber = `ORD-${crypto.randomUUID()
    .slice(0, 8)
    .toUpperCase()}`;

  // 5. Race condition fix (atomic update)
  const { data: updatedSlot, error: updateError } = await supabase
    .from("time_slots")
    .update({ is_booked: true })
    .eq("id", timeSlotId)
    .eq("is_booked", false)
    .select();

  if (updateError) {
    return res.status(500).json({ error: "Failed to update slot" });
  }

  if (!updatedSlot || updatedSlot.length === 0) {
    return res.status(400).json({ error: "Time slot already booked" });
  }

  //  6. Skapa booking
  const { error: insertError } = await supabase
    .from("bookings")
    .insert({
      time_slot_id: timeSlotId,
      order_number: orderNumber,
      user_id: userId
    });

  if (insertError) {
    return res.status(500).json({ error: "Failed to create booking" });
  }

  //  7. Svar
  res.status(201).json({ orderNumber });
});


/* =======================
   CANCEL BOOKING
======================= */
router.delete("/:orderNumber", async (req, res) => {
  //  1. Validera params
  const parsedParams = orderNumberSchema.safeParse(req.params);

  if (!parsedParams.success) {
    return res.status(400).json({ error: "Invalid order number" });
  }

  const { orderNumber } = parsedParams.data;

  //  2. Hämta booking
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("order_number", orderNumber)
    .single();

  if (error || !booking) {
    return res.status(404).json({ error: "Booking not found" });
  }

  //  3. Access control
  if (booking.user_id !== req.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  //  4. Ta bort bokning
  const { error: deleteError } = await supabase
    .from("bookings")
    .delete()
    .eq("id", booking.id);

  if (deleteError) {
    return res.status(500).json({ error: "Failed to delete booking" });
  }

  // 5. Frigör slot
  const { error: updateError } = await supabase
    .from("time_slots")
    .update({ is_booked: false })
    .eq("id", booking.time_slot_id);

  if (updateError) {
    return res.status(500).json({ error: "Failed to update time slot" });
  }

  // 6. Svar
  res.status(200).json({ message: "Booking cancelled" });
});

/* =======================
   UPDATE BOOKING
======================= */

const updateBookingSchema = z.object({
  newTimeSlotId: z.number().int().positive()
});


router.put("/:orderNumber", async (req, res) => {
  // 1. Validera params
  const parsedParams = orderNumberSchema.safeParse(req.params);
  if (!parsedParams.success) {
    return res.status(400).json({ error: "Invalid order number" });
  }

  const { orderNumber } = parsedParams.data;

  //  2. Validera body
  const parsedBody = updateBookingSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const { newTimeSlotId } = parsedBody.data;

  // 3. Hämta booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("*")
    .eq("order_number", orderNumber)
    .single();

  if (bookingError || !booking) {
    return res.status(404).json({ error: "Booking not found" });
  }

  //  4. Access control
  if (booking.user_id !== req.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  //  Extra check (bra att ha)
  if (booking.time_slot_id === newTimeSlotId) {
    return res.status(400).json({ error: "Cannot reschedule to same slot" });
  }

  //  5. Hämta ny slot
  const { data: newSlot, error: slotError } = await supabase
    .from("time_slots")
    .select("*")
    .eq("id", newTimeSlotId)
    .single();

  if (slotError || !newSlot) {
    return res.status(404).json({ error: "New time slot not found" });
  }

  if (newSlot.is_booked) {
    return res.status(400).json({ error: "New time slot is already booked" });
  }

  //  6. Race condition fix (viktigt här också!)
  const { data: updatedNewSlot, error: updateNewError } = await supabase
    .from("time_slots")
    .update({ is_booked: true })
    .eq("id", newTimeSlotId)
    .eq("is_booked", false)
    .select();

  if (updateNewError) {
    return res.status(500).json({ error: "Failed to book new slot" });
  }

  if (!updatedNewSlot || updatedNewSlot.length === 0) {
    return res.status(400).json({ error: "New time slot already booked" });
  }

  //  7. Frigör gamla sloten
  const { error: freeOldError } = await supabase
    .from("time_slots")
    .update({ is_booked: false })
    .eq("id", booking.time_slot_id);

  if (freeOldError) {
    return res.status(500).json({ error: "Failed to free old slot" });
  }

  //  8. Uppdatera booking
  const { error: updateBookingError } = await supabase
    .from("bookings")
    .update({ time_slot_id: newTimeSlotId })
    .eq("id", booking.id);

  if (updateBookingError) {
    return res.status(500).json({ error: "Failed to update booking" });
  }

  res.status(200).json({ message: "Booking updated" });
});

export default router;