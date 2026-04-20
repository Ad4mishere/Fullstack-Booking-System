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
      event: "booking_create_attempt",
      userId: req.user?.id
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
      userId,
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
      event: "booking_update_attempt",
      userId: req.user?.id
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

    const { error } = await supabase.rpc("update_booking", {
      p_order_number: orderNumber,
      p_user_id: userId,
      p_new_slot_id: newTimeSlotId
    });

    if (error) {
      logger.warn({
        event: "booking_update_failed",
        userId,
        message: error.message
      });

      return res.status(400).json({ error: error.message });
    }

    logger.info({
      event: "booking_update_success",
      userId,
      orderNumber
    });

    return res.status(200).json({ message: "Booking updated" });

  } catch (err) {
    logger.error({
      event: "booking_update_crash",
      message: err.message
    });
    return res.status(500).json({ error: "Internal server error" });
  }
});

/* =======================
   CANCEL BOOKING
======================= */
router.delete("/:orderNumber", async (req, res) => {
  try {
    logger.info({
      event: "booking_delete_attempt",
      userId: req.user?.id
    });

    const parsedParams = orderNumberSchema.safeParse(req.params);
    if (!parsedParams.success) {
      logger.warn({ event: "booking_delete_invalid_order_number" });
      return res.status(400).json({ error: "Invalid order number" });
    }

    const { orderNumber } = parsedParams.data;
    const userId = req.user.id;

    const { error } = await supabase.rpc("cancel_booking", {
      p_order_number: orderNumber,
      p_user_id: userId
    });

    if (error) {
      logger.warn({
        event: "booking_delete_failed",
        message: error.message
      });

      return res.status(400).json({ error: error.message });
    }

    logger.info({
      event: "booking_delete_success",
      userId,
      orderNumber
    });

    return res.status(200).json({ message: "Booking cancelled" });

  } catch (err) {
    logger.error({
      event: "booking_delete_crash",
      message: err.message
    });
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;