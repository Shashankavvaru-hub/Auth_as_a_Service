import { AuditLog } from "./audit.model.js";

export const logAudit = async ({
  userId,
  appId,
  action,
  userAgent,
}) => {
  try {
    await AuditLog.create({
      userId,
      appId,
      action,
      userAgent,
    });
  } catch {
    // Audit logging must NEVER block auth flows
  }
};
