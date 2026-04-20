import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../env.js";

const JWT_SECRET = env.JWT_SECRET;

// persistent test-user (CI)
let testUserId = "test-user";

export function authMiddleware(req, res, next) {
  let token = req.cookies.token;

  // =========================
  // TEST MODE
  // =========================
  if (process.env.NODE_ENV === "test") {
    req.user = { id: testUserId };
    return next();
  }

  // =========================
  // NO TOKEN → CREATE SESSION
  // =========================
  if (!token) {
    const userId = crypto.randomUUID();

    const newToken = jwt.sign(
      { sub: userId },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    });

    req.user = { id: userId };
    return next();
  }

  // =========================
  // VERIFY TOKEN
  // =========================
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.sub };
    return next();

  } catch (err) {
    // 🔥 FIX: istället för 401 → skapa ny session
    console.warn("JWT invalid, creating new session:", err.message);

    const userId = crypto.randomUUID();

    const newToken = jwt.sign(
      { sub: userId },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    });

    req.user = { id: userId };
    return next();
  }
}