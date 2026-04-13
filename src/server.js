import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

import { supabase } from "./supabaseClient.js";
import { generateTimeSlots } from "./generateTimeSlots.js";

import timeSlotsRoutes from "./routes/timeSlots.routes.js";
import bookingsRoutes from "./routes/bookings.routes.js";

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

/* === FRONTEND === */
app.use(
  express.static(path.join(__dirname, "frontend"))
);

/* === SEED VID START (Supabase) === */
(async () => {
  const { data, error } = await supabase
    .from("time_slots")
    .select("id");

  if (error) {
    console.error("Error checking time_slots:", error);
    return;
  }

  if (!data || data.length === 0) {
    console.log("Seeding Supabase...");
    await generateTimeSlots(10);
  }
})();

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