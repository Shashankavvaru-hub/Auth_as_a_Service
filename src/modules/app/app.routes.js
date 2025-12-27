import { Router } from "express";
import { registerApp, verifyAppEmail } from "./app.controller.js";
import { appRegistrationLimiter } from "../../utils/rate-limit.util.js";

const router = Router();

/**
 * POST /api/apps
 * Create a new client application
 */
router.post("/register",appRegistrationLimiter,registerApp);
router.get("/verify-email", verifyAppEmail);

export default router;
