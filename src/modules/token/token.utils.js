import crypto from "crypto";

/**
 * Generate cryptographically secure refresh token
 */
export const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

/**
 * Hash refresh token before storing
 */
export const hashRefreshToken = (token) => {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};
