import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import { db } from "./db.js";
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

/* === SEED VID START === */
const count = db
  .prepare("SELECT COUNT(*) AS count FROM time_slots")
  .get();

if (count.count === 0) {
  generateTimeSlots(10);
}

/* === API ROUTES === */
app.use("/api/time-slots", timeSlotsRoutes);
app.use("/api/bookings", bookingsRoutes);

/* === HEALTH === */
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
