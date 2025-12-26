import { User } from "../user/user.model.js";
import { verifyGoogleIdToken } from "../oauth/google.oauth.js";
import { createAccessToken, createRefreshToken } from "../token/token.service.js";
import { logAudit } from "../audit/audit.service.js";

export const googleOAuthService = async ({
  idToken,
  app,
  userAgent,
}) => {
  const profile = await verifyGoogleIdToken(idToken);

  if (!profile.emailVerified) {
    const err = new Error("Google email not verified");
    err.statusCode = 403;
    throw err;
  }

  // 1) Try find by provider link
  let user = await User.findOne({
    appId: app._id,
    "oauthProviders.provider": "google",
    "oauthProviders.providerId": profile.providerId,
  });

  // 2) Else try find by email (link accounts)
  if (!user) {
    user = await User.findOne({
      appId: app._id,
      email: profile.email.toLowerCase(),
    });

    if (user) {
      // link Google to existing account
      user.oauthProviders.push({
        provider: "google",
        providerId: profile.providerId,
      });
      await user.save();
    }
  }

  // 3) Else create new user
  if (!user) {
    user = await User.create({
      email: profile.email.toLowerCase(),
      appId: app._id,
      isEmailVerified: true,
      roles: ["user"],
      oauthProviders: [{
        provider: "google",
        providerId: profile.providerId,
      }],
      passwordHash: null, // OAuth-only
    });
  }

  // 4) Issue tokens
  const accessToken = createAccessToken({ user, app });
  const refreshToken = await createRefreshToken({ user, app });

  await logAudit({
    userId: user._id,
    appId: app._id,
    action: "OAUTH_GOOGLE_LOGIN",
    ip: null,
    userAgent,
  });

  return { accessToken, refreshToken };
};
