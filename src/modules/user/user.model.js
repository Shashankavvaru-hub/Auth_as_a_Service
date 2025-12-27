import mongoose from "mongoose";

const oauthProviderSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ["google", "github"],
    },
    providerUserId: {
      type: String,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    appId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClientApp",
      required: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationTokenHash: String,
    emailVerificationTokenExpiresAt: Date,

    passwordResetTokenHash: String,
    passwordResetTokenExpiresAt: Date,

    roles: {
      type: [String],
      default: ["user"],
    },

    oauthProviders: [oauthProviderSchema],
  },
  {
    timestamps: true,
  }
);

/**
 * Same email can exist in different apps
 */
userSchema.index({ email: 1, appId: 1 }, { unique: true });

export const User = mongoose.model("User", userSchema);
