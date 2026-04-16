import express from "express";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { supabase } from "../supabaseClient.js";
import { z } from "zod";

const router = express.Router();

/* =======================
   RATE LIMIT (BOOKINGS)
======================= */
const bookingLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 50,
  message: { error: "Too many booking requests" }
});

router.use(bookingLimiter);

/* =======================
   SCHEMAS
======================= */

const orderNumberSchema = z.object({
  orderNumber: z.string().regex(/^ORD-[A-Z0-9]+$/)
});

const createBookingSchema = z.object({
  timeSlotId: z.coerce.number().int().positive()
});

const updateBookingSchema = z.object({
  newTimeSlotId: z.coerce.number().int().positive()
});

/* =======================
   LOGGING HELPER
======================= */
function log(action, data = {}) {
  console.log(`[BOOKING] ${action}`, {
    ...data,
    timestamp: new Date().toISOString()
  });
}

/* =======================
   CREATE BOOKING
======================= */
router.post("/", async (req, res) => {
  try {
    log("CREATE_ATTEMPT", { body: req.body });

    const parsed = createBookingSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const { timeSlotId } = parsed.data;
    const userId = req.user.id;

    // 1. Kontrollera att slot finns
    const { data: slot, error: slotError } = await supabase
      .from("time_slots")
      .select("*")
      .eq("id", timeSlotId)
      .single();

    if (slotError || !slot) {
      return res.status(404).json({ error: "Time slot not found" });
    }

    // 2. Race condition-safe booking
    const { data: updatedSlot } = await supabase
      .from("time_slots")
      .update({ is_booked: true })
      .eq("id", timeSlotId)
      .eq("is_booked", false)
      .select();

    if (!updatedSlot || updatedSlot.length === 0) {
      return res.status(400).json({ error: "Time slot already booked" });
    }

    // 3. Skapa ordernummer
    const orderNumber = `ORD-${crypto.randomUUID()
      .slice(0, 8)
      .toUpperCase()}`;

    // 4. Skapa booking
    const { error: insertError } = await supabase
      .from("bookings")
      .insert({
        time_slot_id: timeSlotId,
        order_number: orderNumber,
        user_id: userId
      });

    if (insertError) {
      log("CREATE_FAILED", { insertError });
      return res.status(500).json({ error: "Failed to create booking" });
    }

    log("CREATE_SUCCESS", { orderNumber, userId });

    return res.status(201).json({ orderNumber });

  } catch (err) {
    log("CREATE_CRASH", { err });
    return res.status(500).json({ error: "Internal server error" });
  }
});

/* =======================
   UPDATE BOOKING
======================= */
router.put("/:orderNumber", async (req, res) => {
  try {
    log("UPDATE_ATTEMPT", { params: req.params, body: req.body });

    const parsedParams = orderNumberSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return res.status(400).json({ error: "Invalid order number" });
    }

    const parsedBody = updateBookingSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const { orderNumber } = parsedParams.data;
    const { newTimeSlotId } = parsedBody.data;
    const userId = req.user.id;

    // 1. Hämta booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("order_number", orderNumber)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // 2. Access control
    if (booking.user_id !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (booking.time_slot_id === newTimeSlotId) {
      return res.status(400).json({ error: "Same time slot" });
    }

    // 3. Hämta ny slot
    const { data: newSlot } = await supabase
      .from("time_slots")
      .select("*")
      .eq("id", newTimeSlotId)
      .single();

    if (!newSlot) {
      return res.status(404).json({ error: "New time slot not found" });
    }

    // 4. Race-safe booking av ny slot
    const { data: updatedNewSlot } = await supabase
      .from("time_slots")
      .update({ is_booked: true })
      .eq("id", newTimeSlotId)
      .eq("is_booked", false)
      .select();

    if (!updatedNewSlot || updatedNewSlot.length === 0) {
      return res.status(400).json({ error: "New time slot already booked" });
    }

    // 5. Frigör gammal slot
    await supabase
      .from("time_slots")
      .update({ is_booked: false })
      .eq("id", booking.time_slot_id);

    // 6. Uppdatera booking
    await supabase
      .from("bookings")
      .update({ time_slot_id: newTimeSlotId })
      .eq("id", booking.id);

    log("UPDATE_SUCCESS", { orderNumber });

    res.status(200).json({ message: "Booking updated" });

  } catch (err) {
    log("UPDATE_CRASH", { err });
    res.status(500).json({ error: "Internal server error" });
  }
});

/* =======================
   CANCEL BOOKING
======================= */
router.delete("/:orderNumber", async (req, res) => {
  try {
    log("DELETE_ATTEMPT", { params: req.params });

    const parsedParams = orderNumberSchema.safeParse(req.params);

    if (!parsedParams.success) {
      return res.status(400).json({ error: "Invalid order number" });
    }

    const { orderNumber } = parsedParams.data;
    const userId = req.user.id;

    // 1. Hämta booking
    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("order_number", orderNumber)
      .single();

    if (error || !booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // 2. Access control
    if (booking.user_id !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // 3. Ta bort booking
    await supabase
      .from("bookings")
      .delete()
      .eq("id", booking.id);

    // 4. Frigör slot
    await supabase
      .from("time_slots")
      .update({ is_booked: false })
      .eq("id", booking.time_slot_id);

    log("DELETE_SUCCESS", { orderNumber });

    res.status(200).json({ message: "Booking cancelled" });

  } catch (err) {
    log("DELETE_CRASH", { err });
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;