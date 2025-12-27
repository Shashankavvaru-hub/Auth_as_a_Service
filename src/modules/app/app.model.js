import mongoose from "mongoose";

const clientAppSchema = new mongoose.Schema(
  {
    appId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    appSecretHash: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true, // 🚨 one app per email (for now)
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationTokenHash: String,
    emailVerificationTokenExpiresAt: Date,

    frontendBaseUrl: {
      type: String,
      required: true,
    },

    allowedOrigins: {
      type: [String],
      default: [],
    },

    accessTokenTTL: {
      type: String,
      default: "10m",
    },

    refreshTokenTTL: {
      type: String,
      default: "30d",
    },
  },
  {
    timestamps: true,
  }
);

export const ClientApp = mongoose.model("ClientApp", clientAppSchema);
