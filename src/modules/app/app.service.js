import crypto from "crypto";
import bcrypt from "bcrypt";
import { ClientApp } from "./app.model.js";
import { env } from "../../config/env.js";
import { generateVerificationToken } from "../../utils/token.util.js";
import { sendEmail } from "../../utils/mailer.util.js";
import { appVerificationEmail } from "../../utils/email-template.util.js";

export const createClientApp = async ({
  name,
  email,
  frontendBaseUrl,
  allowedOrigins = [],
  accessTokenTTL,
  refreshTokenTTL,
}) => {
  const existingApp = await ClientApp.findOne({ email });
  if (existingApp) {
    throw new Error("An app is already registered with this email");
  }

  // Generating credentials
  const appId = crypto.randomUUID();
  const appSecret = crypto.randomBytes(32).toString("hex");

  const appSecretHash = await bcrypt.hash(appSecret, env.bcryptRounds);
  const { token, tokenHash } = generateVerificationToken();

  const app = await ClientApp.create({
    appId,
    appSecretHash,
    name,
    email,
    frontendBaseUrl,
    allowedOrigins,
    accessTokenTTL,
    refreshTokenTTL,
    emailVerificationTokenHash: tokenHash,
    emailVerificationTokenExpiresAt: new Date(
      Date.now() + 24 * 60 * 60 * 1000 // 24h
    ),
  });

  const verifyUrl = `${env.appBaseUrl}/api/app/verify-email?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Verify your app email",
    html: appVerificationEmail({
      appName: name,
      verifyUrl,
    }),
  });

  return {
    appId: app.appId,
    appSecret,
  };
};
