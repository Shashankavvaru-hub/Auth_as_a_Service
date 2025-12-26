import { env } from "../../config/env.js";
import { googleOAuthService } from "./oauth.service.js";

/**
 * Redirect user to Google
 */
export const googleRedirect = (req, res) => {
  const params = new URLSearchParams({
    client_id: env.google.clientId,
    redirect_uri: env.google.redirectUri,
    response_type: "id_token",
    scope: "openid email profile",
    nonce: crypto.randomUUID(),
    prompt: "select_account",
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
};

/**
 * Google redirects back here
 */
export const googleCallback = async (req, res, next) => {
  try {
    // Google returns id_token in fragment (#). Frontend usually forwards it.
    // For simplicity, accept idToken via query or body (frontend POSTs it).
    const idToken = req.query.id_token || req.body.idToken;
    if (!idToken) {
      return res.status(400).json({ message: "Missing Google id_token" });
    }

    const { accessToken, refreshToken } = await googleOAuthService({
      idToken,
      app: req.app,
      userAgent: req.headers["user-agent"],
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false, // true in prod
      sameSite: "lax",
      path: "/api/auth/refresh",
    });

    // In real apps, redirect to client with short-lived code or just respond
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
};
