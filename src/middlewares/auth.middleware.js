import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const authenticate = (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing access token" });
    }

    const token = header.split(" ")[1];
    const payload = jwt.verify(token, env.jwt.accessSecret);

    req.user = {
      id: payload.userId,
      appId: payload.appId,
      roles: payload.roles || [],
    };

    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
};
