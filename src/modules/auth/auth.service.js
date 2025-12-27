import bcrypt from "bcrypt";
import { User } from "../user/user.model.js";
import { RefreshToken } from "../token/refreshToken.model.js";
import {
  createAccessToken,
  createRefreshToken,
} from "../token/token.service.js";
import { logAudit } from "../audit/audit.service.js";
import { hashRefreshToken } from "../token/token.utils.js";
import {
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
} from "../token/token.service.js";
import { generateVerificationToken } from "../../utils/token.util.js";
import { generatePasswordResetToken } from "../../utils/password-reset.util.js";
import { sendEmail } from "../../utils/mailer.util.js";
import { env } from "../../config/env.js";

export const loginService = async ({ email, password, app, userAgent }) => {
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
  if (!user.isEmailVerified) {
    throw Object.assign(new Error("Email not verified"), {
      statusCode: 403,
    });
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

export const registerService = async ({ email, password, app, userAgent }) => {
  const normalizedEmail = email.toLowerCase();

  const existing = await User.findOne({
    email: normalizedEmail,
    appId: app._id,
  });

  if (existing) {
    throw Object.assign(new Error("User already exists"), {
      statusCode: 409,
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    email: normalizedEmail,
    passwordHash,
    appId: app._id,
    isEmailVerified: false,
    roles: ["user"],
  });

  const { token, tokenHash } = generateVerificationToken();

  user.emailVerificationTokenHash = tokenHash;
  user.emailVerificationTokenExpiresAt = new Date(
    Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  );

  await user.save();

  const verifyUrl = `${env.appBaseUrl}/api/auth/verify-email?token=${token}`;

  await sendEmail({
    to: user.email,
    subject: "Verify your email address",
    html: `
      <h3>Verify your email</h3>
      <p>Thanks for registering.</p>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verifyUrl}">Verify Email</a>
      <p>This link expires in 24 hours.</p>
    `,
  });

  await logAudit({
    userId: user._id,
    appId: app._id,
    action: "USER_REGISTERED",
    ip: null,
    userAgent,
  });

  return {
    message: "Registration successful. Please verify your email.",
  };
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

export const logoutService = async ({ rawRefreshToken, app, userAgent }) => {
  await revokeRefreshToken({ rawRefreshToken });

  await logAudit({
    userId: null, // optional (token-based logout)
    appId: app._id,
    action: "LOGOUT",
    ip: null,
    userAgent,
  });
};

// Logout from all devices for this user + app
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

export const resendVerificationService = async ({ email, app }) => {
  const normalizedEmail = email.toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
    appId: app._id,
  });

  // Always return success (prevent enumeration)
  if (!user || user.isEmailVerified) return;

  const { token, tokenHash } = generateVerificationToken();

  user.emailVerificationTokenHash = tokenHash;
  user.emailVerificationTokenExpiresAt = new Date(
    Date.now() + 24 * 60 * 60 * 1000
  );

  await user.save();

  const verifyUrl = `${env.appBaseUrl}/api/auth/verify-email?token=${token}`;

  await sendEmail({
    to: user.email,
    subject: "Verify your email",
    html: `
      <p>You requested a new verification email.</p>
      <a href="${verifyUrl}">Verify Email</a>
      <p>This link expires in 24 hours.</p>
    `,
  });
};

export const forgotPasswordService = async ({ email, app }) => {
  const user = await User.findOne({ email, appId: app._id });

  // Always return success (prevent user enumeration)
  if (!user) return;

  const { token, tokenHash } = generatePasswordResetToken();

  user.passwordResetTokenHash = tokenHash;
  user.passwordResetTokenExpiresAt = new Date(
    Date.now() + 60 * 60 * 1000 // 1 hour
  );

  await user.save();

  const resetUrl = `${app.frontendBaseUrl}/reset-password?token=${token}`;

  await sendEmail({
    to: user.email,
    subject: "Reset your password",
    html: `
      <p>You requested a password reset.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link expires in 1 hour.</p>
    `,
  });
};

export const resetPasswordService = async ({ token, newPassword, app }) => {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetTokenExpiresAt: { $gt: Date.now() },
    appId: app._id,
  });

  if (!user) {
    throw new Error("Invalid or expired password reset token");
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.passwordResetTokenHash = undefined;
  user.passwordResetTokenExpiresAt = undefined;

  await user.save();

  // Security: revoke all sessions
  await RefreshToken.updateMany(
    { userId: user._id, appId: app._id },
    { isRevoked: true }
  );
};
