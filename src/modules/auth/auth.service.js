import bcrypt from "bcrypt";
import { User } from "../user/user.model.js";
import { RefreshToken } from "../token/refreshToken.model.js";
import {
  createAccessToken,
  createRefreshToken,
} from "../token/token.service.js";
import { logAudit } from "../audit/audit.service.js";
import { hashRefreshToken } from "../token/token.utils.js";
import { rotateRefreshToken , revokeRefreshToken,revokeAllUserTokens} from "../token/token.service.js";

export const loginService = async ({ email, password, app,
  userAgent,}) => {
  const user = await User.findOne({
    email: email.toLowerCase(),
    appId: app._id,
  });

  if (!user || !user.passwordHash) {
    await logAudit({
      appId: app._id,
      action: "LOGIN_FAILED",
      userAgent,
    });
    throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    await logAudit({
      userId: user._id,
      appId: app._id,
      action: "LOGIN_FAILED",
      userAgent,
    });
    throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
  }

  if (!user.isEmailVerified) {
    throw Object.assign(new Error("Email not verified"), { statusCode: 403 });
  }

  const accessToken = createAccessToken({ user, app });
  const refreshToken = await createRefreshToken({ user, app });

  await logAudit({
    userId: user._id,
    appId: app._id,
    action: "LOGIN_SUCCESS",
    userAgent,
  });

  return { accessToken, refreshToken, user };
};

export const registerService = async ({
  email,
  password,
  app,
  userAgent,
}) => {
  const existing = await User.findOne({
    email: email.toLowerCase(),
    appId: app._id,
  });

  if (existing) {
    throw Object.assign(new Error("User already exists"), {
      statusCode: 409,
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    email: email.toLowerCase(),
    passwordHash,
    appId: app._id,
    isEmailVerified: true, // skip email flow for now
    roles: ["user"],
  });

  await logAudit({
    userId: user._id,
    appId: app._id,
    action: "USER_REGISTERED",
    ip: null,
    userAgent,
  });

  return user;
};

export const refreshService = async ({ rawRefreshToken, app, userAgent }) => {
  if (!rawRefreshToken) {
    const err = new Error("Refresh token missing");
    err.statusCode = 401;
    throw err;
  }

  // We need the user to issue a new access token.
  // Find user via the refresh token record.
  const tokenHash = hashRefreshToken(rawRefreshToken);

  const tokenDoc = await RefreshToken.findOne({ tokenHash });

  if (!tokenDoc) {
    const err = new Error("Invalid refresh token");
    err.statusCode = 401;
    throw err;
  }

  const user = await User.findById(tokenDoc.userId);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 401;
    throw err;
  }

  const result = await rotateRefreshToken({
    rawRefreshToken,
    user,
    app,
  });

  await logAudit({
    userId: user._id,
    appId: app._id,
    action: "TOKEN_REFRESH",
    ip: null,
    userAgent,
  });

  return result;
};

/**
 * Logout from current device
 */
export const logoutService = async ({ rawRefreshToken, app, userAgent }) => {
  await revokeRefreshToken({ rawRefreshToken });

  await logAudit({
    userId: null,            // optional (token-based logout)
    appId: app._id,
    action: "LOGOUT",
    ip: null,
    userAgent,
  });
};

/**
 * Logout from all devices for this user + app
 */
export const logoutAllService = async ({ user, app, userAgent }) => {
  await revokeAllUserTokens({
    userId: user._id,
    appId: app._id,
  });

  await logAudit({
    userId: user._id,
    appId: app._id,
    action: "LOGOUT_ALL",
    ip: null,
    userAgent,
  });
};

