import { createClientApp } from "./app.service.js";
import crypto from "crypto";
import { ClientApp } from "./app.model.js";

export const registerApp = async (req, res, next) => {
  try {
    const { name, email, allowedOrigins, accessTokenTTL, refreshTokenTTL, frontendBaseUrl } =
      req.body;

    if (!name || !email || !frontendBaseUrl) {
      return res.status(400).json({ message: "App name or Email or frontendBaseURL is missing" });
    }

    const credentials = await createClientApp({
      name,
      email,
      allowedOrigins,
      frontendBaseUrl,
      accessTokenTTL,
      refreshTokenTTL,
    });

    res.status(201).json({
      message: "App created successfully",
      ...credentials,
    });
  } catch (err) {
    next(err);
  }
};

export const verifyAppEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const app = await ClientApp.findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationTokenExpiresAt: { $gt: Date.now() },
    });

    if (!app) {
      return res.status(400).json({
        message: "Invalid or expired verification token",
      });
    }

    app.isEmailVerified = true;
    app.emailVerificationTokenHash = undefined;
    app.emailVerificationTokenExpiresAt = undefined;

    await app.save();

    res.json({ message: "App email verified successfully" });
  } catch (err) {
    next(err);
  }
};