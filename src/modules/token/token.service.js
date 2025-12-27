import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { RefreshToken } from "./refreshToken.model.js";
import { generateRefreshToken, hashRefreshToken } from "./token.utils.js";
import { resolveTokenTTLs } from "../../utils/token-ttl.util.js";
import ms from "ms";

/**
 * Create JWT access token
 */
export const createAccessToken = ({ user, app }) => {
  const { accessTokenTTL } = resolveTokenTTLs(app, env);
  return jwt.sign(
    {
      userId: user._id,
      appId: app._id,
      roles: user.roles,
    },
    env.jwt.accessSecret,
    {
      expiresIn: accessTokenTTL,
    }
  );
};

/**
 * Create & store refresh token (SESSION)
 */
export const createRefreshToken = async ({ user, app }) => {
  const rawToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(rawToken);
  const { refreshTokenTTL } = resolveTokenTTLs(app, env);

  const expiresAt = new Date(Date.now() + ms(refreshTokenTTL));

  await RefreshToken.create({
    userId: user._id,
    appId: app._id,
    tokenHash,
    expiresAt,
  });

  return rawToken; // send ONLY raw token to client
};

export const rotateRefreshToken = async ({ rawRefreshToken, user, app }) => {
  const tokenHash = hashRefreshToken(rawRefreshToken);

  // Find existing session
  const existing = await RefreshToken.findOne({ tokenHash });

  // Reuse detection
  if (!existing || existing.isRevoked || existing.expiresAt < new Date()) {
    // Compromise: revoke ALL sessions for this user+app
    await RefreshToken.updateMany(
      { userId: user._id, appId: app._id },
      { isRevoked: true }
    );

    const err = new Error("Refresh token reuse detected");
    err.statusCode = 401;
    err.code = "TOKEN_REUSE";
    throw err;
  }

  // Revoke old token
  existing.isRevoked = true;
  await existing.save();

  // Issue NEW refresh token
  const newRaw = generateRefreshToken();
  const newHash = hashRefreshToken(newRaw);

  const expiresAt = new Date(
    Date.now() + parseDuration(app.refreshTokenTTL || env.jwt.refreshTTL)
  );

  await RefreshToken.create({
    userId: user._id,
    appId: app._id,
    tokenHash: newHash,
    expiresAt,
  });

  // Issue new access token
  const accessToken = createAccessToken({ user, app });

  return { accessToken, refreshToken: newRaw };
};

/**
 * Revoke a single refresh token (logout current device)
 */
export const revokeRefreshToken = async ({ rawRefreshToken }) => {
  if (!rawRefreshToken) return;

  const tokenHash = hashRefreshToken(rawRefreshToken);

  await RefreshToken.updateOne({ tokenHash }, { isRevoked: true });
};

/**
 * Revoke ALL refresh tokens for a user within an app (logout-all)
 */
export const revokeAllUserTokens = async ({ userId, appId }) => {
  await RefreshToken.updateMany(
    { userId, appId, isRevoked: false },
    { isRevoked: true }
  );
};

const parseDuration = (duration) => {
  const value = parseInt(duration.slice(0, -1));
  const unit = duration.slice(-1);

  switch (unit) {
    case "d":
      return value * 24 * 60 * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "m":
      return value * 60 * 1000;
    default:
      throw new Error("Invalid duration format");
  }
};
