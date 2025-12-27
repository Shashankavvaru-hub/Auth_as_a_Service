import { Router } from "express";
import {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  verifyUserEmail,
  resendVerification,
  forgotPassword,
  resetPassword
} from "./auth.controller.js";
import { googleRedirect, googleCallback } from "../oauth/oauth.controller.js";
import { loginLimiter, refreshLimiter } from "../../utils/rate-limit.util.js";


const router = Router();
/**
 * Base path: /api/auth
 */

router.post("/register", register);
router.post("/login", loginLimiter, login);
router.post("/refresh", refreshLimiter, refresh);
router.post("/logout", logout);
router.post("/logout-all", logoutAll);

router.get("/verify-email", verifyUserEmail);
router.post("/resend-verification", loginLimiter, resendVerification);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);


router.get("/oauth/google", googleRedirect);
router.post("/oauth/google/callback", googleCallback);

export default router;
