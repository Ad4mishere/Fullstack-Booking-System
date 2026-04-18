import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export function authMiddleware(req, res, next) {
  let token = req.cookies.token;

  if (!token) {
  // 🔥 CI / TEST fallback
  if (process.env.NODE_ENV === "test") {
    req.user = { id: "test-user" };
    return next();
  }

  const userId = crypto.randomUUID();

  token = jwt.sign(
    { sub: userId },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
  });

  req.user = { id: userId };
  return next();
}

    req.user = { id: userId };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.sub };
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}