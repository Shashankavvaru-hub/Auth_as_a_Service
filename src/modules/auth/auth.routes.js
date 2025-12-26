import { Router } from "express";
import {
  register,
  login,
  refresh,
  logout,
  logoutAll,
} from "./auth.controller.js";
import { appAuth } from "../../middlewares/app-auth.middleware.js";
import { googleRedirect, googleCallback } from "../oauth/oauth.controller.js";



const router = Router();

/**
 * AUTH ROUTES
 * Base path: /api/auth
*/

router.post("/register", appAuth, register);
router.post("/login", appAuth, login);
router.post("/refresh", appAuth, refresh);
router.post("/logout", appAuth, logout);
router.post("/logout-all", appAuth, logoutAll);

router.get("/oauth/google", appAuth, googleRedirect);
router.post("/oauth/google/callback", appAuth, googleCallback);

export default router;
