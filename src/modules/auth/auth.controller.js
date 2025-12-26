/**
 * AUTH CONTROLLER
 * Controllers should be THIN.
 * No business logic here.
 */

import { loginService } from "./auth.service.js";
import { registerService } from "./auth.service.js";
import { refreshService } from "./auth.service.js";
import { logoutService, logoutAllService } from "./auth.service.js";


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
      secure: false,   // true in production
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
      secure: false, // true in prod
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
