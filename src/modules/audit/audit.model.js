import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    appId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClientApp",
    },

    action: {
      type: String,
      required: true,
      enum: [
        "USER_REGISTERED",
        "LOGIN_SUCCESS",
        "LOGIN_FAILED",
        "TOKEN_REFRESH",
        "TOKEN_REVOKED",
        "TOKEN_REUSE_DETECTED",
        "LOGOUT",
        "LOGOUT_ALL",
        "PASSWORD_CHANGED",
        "OAUTH_LOGIN",
      ],
    },

    ip: String,
    userAgent: String,
  },
  {
    timestamps: true,
  }
);

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
