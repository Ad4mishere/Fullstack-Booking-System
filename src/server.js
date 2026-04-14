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

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

app.use(helmet());

/* === FRONTEND === */
app.use(
  express.static(path.join(__dirname, "frontend"))
);

/* 🔥 RATE LIMITER (endast API) */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests" }
});

app.use("/api", limiter);

/* === SEED SUPABASE === */
async function seedTimeSlots() {
  const { data } = await supabase
    .from("time_slots")
    .select("id")
    .limit(1);

  if (!data || data.length === 0) {
    console.log("Seeding time slots...");
    await generateTimeSlots(10);
  }
}

seedTimeSlots();

app.use((req, res, next) => {
  let userId = req.headers["x-user-id"];

  if (!userId) {
    // skapa en enkel anonym user
    userId = crypto.randomUUID();
  }

  req.user = { id: userId };
  next();
});


/* === API ROUTES === */
app.use("/api/time-slots", timeSlotsRoutes);
app.use("/api/bookings", bookingsRoutes);

/* === TEST ROUTE (kan tas bort senare) === */
app.get("/test-db", async (req, res) => {
  const { data, error } = await supabase
    .from("time_slots")
    .select("*");

  if (error) return res.status(500).json(error);

  res.json(data);
});

/* === HEALTH === */
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});