/**
 * AUTH CONTROLLER
 * Controllers should be THIN.
 * No business logic here.
 */

import { loginService } from "./auth.service.js";
import { registerService } from "./auth.service.js";
import { refreshService } from "./auth.service.js";
import { logoutService, logoutAllService } from "./auth.service.js";
import { resendVerificationService } from "./auth.service.js";
import crypto from "crypto";
import { User } from "../user/user.model.js";
import { forgotPasswordService, resetPasswordService } from "./auth.service.js";

export const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await registerService({
      email,
      password,
      app: req.app,
      userAgent: req.headers["user-agent"],
    });

    res.status(201).json({
      message: "User registered successfully",
      userId: user._id,
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { accessToken, refreshToken } = await loginService({
      email,
      password,
      app: req.app,
      userAgent: req.headers["user-agent"],
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/api/auth/refresh",
    });

    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken;

    const { accessToken, refreshToken } = await refreshService({
      rawRefreshToken,
      app: req.app,
      userAgent: req.headers["user-agent"],
    });

    // Rotate cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true, // true in prod
      sameSite: "lax",
      path: "/api/auth/refresh",
    });

    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken;

    await logoutService({
      rawRefreshToken,
      app: req.app,
      userAgent: req.headers["user-agent"],
    });

    // Clear cookie
    res.clearCookie("refreshToken", {
      path: "/api/auth/refresh",
    });

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * Logout all sessions (requires authenticated user)
 */
export const logoutAll = async (req, res, next) => {
  try {
    // You’ll add auth middleware later to populate req.user
    const user = req.user;

    await logoutAllService({
      user,
      app: req.app,
      userAgent: req.headers["user-agent"],
    });

    res.clearCookie("refreshToken", {
      path: "/api/auth/refresh",
    });

    res.json({ message: "Logged out from all devices" });
  } catch (err) {
    next(err);
  }
};

export const verifyUserEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationTokenExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired verification token",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationTokenExpiresAt = undefined;

    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    next(err);
  }
};

export const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    await resendVerificationService({
      email,
      app: req.app,
    });

    res.json({
      message: "If the email exists, a verification link has been sent",
    });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    await forgotPasswordService({
      email,
      app: req.app,
    });

    res.json({
      message: "If the email exists, a reset link has been sent",
    });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res
        .status(400)
        .json({ message: "Token and password are required" });
    }

    await resetPasswordService({
      token,
      newPassword: password,
      app: req.app,
    });

    res.json({ message: "Password reset successful" });
  } catch (err) {
    next(err);
  }
};