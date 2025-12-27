import rateLimit from "express-rate-limit";

// Generic factory
export const createRateLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    //OVERRIDE DEFAULT req.ip BEHAVIOR
    keyGenerator: (req) =>
      req.headers["x-forwarded-for"] || req.socket.remoteAddress,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message,
    },
  });

// Specific limiters
export const appRegistrationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: "Too many app registrations. Try again later.",
});

export const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  message: "Too many login attempts. Try again later.",
});

export const refreshLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many token refresh requests.",
});
