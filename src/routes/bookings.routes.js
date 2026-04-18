import express from "express";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { supabase } from "../supabaseClient.js";
import { z } from "zod";
import { logger } from "../utils/logger.js";

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
   CREATE BOOKING (RPC VERSION)
======================= */
router.post("/", async (req, res) => {
  try {
    logger.info({
      event: "booking_create_attempt"
    });

    const parsed = createBookingSchema.safeParse(req.body);

    if (!parsed.success) {
      logger.warn({
        event: "booking_create_invalid_input"
      });
      return res.status(400).json({ error: "Invalid input" });
    }

    const { timeSlotId } = parsed.data;
    const userId = req.user.id;

    const { data, error } = await supabase.rpc("book_slot", {
      p_slot_id: timeSlotId,
      p_user_id: userId
    });

    if (error) {
      logger.warn({
        event: "booking_create_failed",
        message: error.message
      });

      return res.status(400).json({ error: error.message });
    }

    logger.info({
      event: "booking_create_success",
      orderNumber: data
    });

    return res.status(201).json({ orderNumber: data });

  } catch (err) {
    logger.error({
      event: "booking_create_crash",
      message: err.message
    });
    return res.status(500).json({ error: "Internal server error" });
  }
});

/* =======================
   UPDATE BOOKING
======================= */
router.put("/:orderNumber", async (req, res) => {
  try {
    logger.info({
      event: "booking_update_attempt"
    });

    const parsedParams = orderNumberSchema.safeParse(req.params);
    if (!parsedParams.success) {
      logger.warn({ event: "booking_update_invalid_order_number" });
      return res.status(400).json({ error: "Invalid order number" });
    }

    const parsedBody = updateBookingSchema.safeParse(req.body);
    if (!parsedBody.success) {
      logger.warn({ event: "booking_update_invalid_input" });
      return res.status(400).json({ error: "Invalid input" });
    }

    const { orderNumber } = parsedParams.data;
    const { newTimeSlotId } = parsedBody.data;
    const userId = req.user.id;

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("order_number", orderNumber)
      .eq("user_id", userId) //  IDOR FIX
      .single();

    if (bookingError || !booking) {
      logger.warn({ event: "booking_update_not_found", orderNumber });
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.time_slot_id === newTimeSlotId) {
      return res.status(400).json({ error: "Same time slot" });
    }

    const { data: newSlot } = await supabase
      .from("time_slots")
      .select("*")
      .eq("id", newTimeSlotId)
      .single();

    if (!newSlot) {
      logger.warn({ event: "booking_update_new_slot_not_found" });
      return res.status(404).json({ error: "New time slot not found" });
    }

    const { data: updatedNewSlot } = await supabase
      .from("time_slots")
      .update({ is_booked: true })
      .eq("id", newTimeSlotId)
      .eq("is_booked", false)
      .select();

    if (!updatedNewSlot || updatedNewSlot.length === 0) {
      logger.warn({ event: "booking_update_new_slot_taken" });
      return res.status(400).json({ error: "New time slot already booked" });
    }

    await supabase
      .from("time_slots")
      .update({ is_booked: false })
      .eq("id", booking.time_slot_id);

    await supabase
      .from("bookings")
      .update({ time_slot_id: newTimeSlotId })
      .eq("id", booking.id);

    logger.info({
      event: "booking_update_success",
      orderNumber
    });

    res.status(200).json({ message: "Booking updated" });

  } catch (err) {
    logger.error({
      event: "booking_update_crash",
      message: err.message
    });
    res.status(500).json({ error: "Internal server error" });
  }
});

/* =======================
   CANCEL BOOKING
======================= */
router.delete("/:orderNumber", async (req, res) => {
  try {
    logger.info({
      event: "booking_delete_attempt"
    });

    const parsedParams = orderNumberSchema.safeParse(req.params);

    if (!parsedParams.success) {
      logger.warn({ event: "booking_delete_invalid_order_number" });
      return res.status(400).json({ error: "Invalid order number" });
    }

    const { orderNumber } = parsedParams.data;
    const userId = req.user.id;

    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("order_number", orderNumber)
      .eq("user_id", userId) // IDOR FIX
      .single();

    if (error || !booking) {
      logger.warn({ event: "booking_delete_not_found", orderNumber });
      return res.status(404).json({ error: "Booking not found" });
    }

    await supabase
      .from("bookings")
      .delete()
      .eq("id", booking.id);

    await supabase
      .from("time_slots")
      .update({ is_booked: false })
      .eq("id", booking.time_slot_id);

    logger.info({
      event: "booking_delete_success",
      orderNumber
    });

    res.status(200).json({ message: "Booking cancelled" });

  } catch (err) {
    logger.error({
      event: "booking_delete_crash",
      message: err.message
    });
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;