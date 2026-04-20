import rateLimit from "express-rate-limit";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authMiddleware } from "./middleware/auth.js";
import { logger } from "./utils/logger.js"; 

import { supabase } from "./supabaseClient.js";
import { generateTimeSlots } from "./generateTimeSlots.js";

import timeSlotsRoutes from "./routes/timeSlots.routes.js";
import bookingsRoutes from "./routes/bookings.routes.js";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "https://fullstack-booking-system-production.up.railway.app"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  }
}));

app.use(cookieParser());

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://fullstack-booking-system.vercel.app"
  ],
  credentials: true
}));

app.use(express.json());

/* =======================
   LOGGING
======================= */
app.use((req, res, next) => {
  logger.info({
    event: "http_request",
    method: req.method,
    url: req.url,
    userId: req.user?.id || null
  });
  next();
});

/* =======================
   STATIC FRONTEND
======================= */
app.use(express.static(path.join(__dirname, "frontend")));

/* =======================
   RATE LIMIT
======================= */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests" }
});
app.use("/api", limiter);

/* =======================
   ROUTES
======================= */

app.use("/api/time-slots", timeSlotsRoutes);
app.use("/api/bookings", authMiddleware, bookingsRoutes);

/* =======================
   HEALTH
======================= */

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

/* =======================
   SEED SUPABASE
======================= */

async function seedTimeSlots() {
  try {
    const { data, error } = await supabase
      .from("time_slots")
      .select("id")
      .limit(1);

    if (error) {
      logger.error({ event: "seed_check_failed", error }); // CHANGED
      return;
    }

    if (!data || data.length === 0) {
      logger.info({ event: "seeding_time_slots" }); // CHANGED
      await generateTimeSlots(10);
    }
  } catch (err) {
    logger.error({ event: "seed_crash", message: err.message }); // CHANGED
  }
}

seedTimeSlots();

/* =======================
   DEBUG
======================= */

app.get("/test-db", async (req, res) => {
  const { data, error } = await supabase
    .from("time_slots")
    .select("*");

  if (error) return res.status(500).json(error);

  res.json(data);
});

/* =======================
   ERROR HANDLER
======================= */

app.use((err, req, res, next) => {
  logger.error({
    event: "global_error",
    message: err.message
  }); // CHANGED

  res.status(500).json({ error: "Internal server error" });
});

/* =======================
   START SERVER
======================= */

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});