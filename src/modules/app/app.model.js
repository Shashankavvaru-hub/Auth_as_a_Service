import mongoose from "mongoose";

const clientAppSchema = new mongoose.Schema(
  {
    appId: {
      type: String,
      required: true,
      unique: true,
    },

    appSecretHash: {
      type: String,
      required: true,
    },

    name: {
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
