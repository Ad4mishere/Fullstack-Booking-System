import rateLimit from "express-rate-limit";
import crypto from "crypto";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";

import { supabase } from "./supabaseClient.js";
import { generateTimeSlots } from "./generateTimeSlots.js";

import timeSlotsRoutes from "./routes/timeSlots.routes.js";
import bookingsRoutes from "./routes/bookings.routes.js";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =======================
   SECURITY MIDDLEWARE
======================= */

app.use(helmet());

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://fullstack-booking-system.vercel.app"
  ],
  credentials: true // 🔥 KRITISK för cookies
}));

app.use(express.json());

app.use(cookieParser(process.env.COOKIE_SECRET || "dev-secret"));

/* =======================
   LOGGING
======================= */
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
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
   USER MIDDLEWARE (SIGNED COOKIE)
======================= */

const isProduction = process.env.NODE_ENV === "production";

const userMiddleware = (req, res, next) => {
  let userId = req.signedCookies.user_id;

  if (!userId) {
    userId = crypto.randomUUID();

    res.cookie("user_id", userId, {
      httpOnly: true,
      secure: isProduction,      // 🔐 HTTPS only in prod
      sameSite: "lax",
      signed: true,              // 🔥 SKYDD mot manipulation
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 dagar
    });

    console.log("New user created:", userId);
  }

  req.user = { id: userId };
  next();
};

/* =======================
   ROUTES
======================= */

app.use("/api/time-slots", timeSlotsRoutes);

// 🔐 Skyddad route
app.use("/api/bookings", userMiddleware, bookingsRoutes);

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
      console.error("Seed check failed:", error);
      return;
    }

    if (!data || data.length === 0) {
      console.log("Seeding time slots...");
      await generateTimeSlots(10);
    }
  } catch (err) {
    console.error("Seed crashed:", err);
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
  console.error("GLOBAL ERROR:", err);
  res.status(500).json({ error: "Internal server error" });
});

/* =======================
   START SERVER
======================= */

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});