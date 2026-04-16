import rateLimit from "express-rate-limit";
import crypto from "crypto";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import helmet from "helmet";

import { supabase } from "./supabaseClient.js";
import { generateTimeSlots } from "./generateTimeSlots.js";

import timeSlotsRoutes from "./routes/timeSlots.routes.js";
import bookingsRoutes from "./routes/bookings.routes.js";
import cors from "cors";
import { z } from "zod";
import session from "express-session";



const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



app.use(session({
  secret: process.env.SESSION_SECRET || "dev-secret",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false // true i production (HTTPS)
  }
}));


app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://fullstack-booking-system.vercel.app"
  ]
}));

app.use(express.json());
app.use(helmet());

// Logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Static frontend
app.use(express.static(path.join(__dirname, "frontend")));

// Rate limiter (endast API)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests" }
});
app.use("/api", limiter);

/* =======================
   USER MIDDLEWARE (FIXAD)
======================= */

const userIdSchema = z.string().min(1);

const userMiddleware = (req, res, next) => {
  let userId;

  // TEST MODE (Postman / CI)
  if (process.env.NODE_ENV === "test" && req.headers["x-user-id"]) {
    userId = req.headers["x-user-id"];
  } 
  // NORMAL MODE
  else {
    if (!req.session.userId) {
      req.session.userId = crypto.randomUUID();
    }
    userId = req.session.userId;
  }

  req.user = { id: userId };
  next();
};

/* =======================
   ROUTES
======================= */

// Public route
app.use("/api/time-slots", timeSlotsRoutes);

// 🔥 KORREKT: middleware + route tillsammans
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

/* =======================
   START SERVER
======================= */

async function startServer() {
  await seedTimeSlots();
}

startServer();

/* =======================
   DEBUG ROUTE
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
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

/* =======================
   LISTEN
======================= */

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});