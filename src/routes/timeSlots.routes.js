import express from "express";
import { supabase } from "../supabaseClient.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const currentTime = now.toTimeString().slice(0, 5);

  const { data, error } = await supabase
    .from("time_slots")
    .select("id, date, start_time")
    .eq("is_booked", false)
    .or(
      `date.gt.${today},and(date.eq.${today},start_time.gt.${currentTime})`
    )
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    return res.status(500).json(error);
  }

  res.status(200).json(data);
});

export default router;