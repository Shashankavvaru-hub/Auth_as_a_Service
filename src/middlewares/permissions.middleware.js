import { ROLE_PERMISSIONS } from "../constants/default-roles.js";

export const requirePermission = (...perms) => {
  return (req, res, next) => {
    const roles = req.user?.roles || [];
    const userPerms = roles.flatMap((r) => ROLE_PERMISSIONS[r] || []);
    const ok = perms.every((p) => userPerms.includes(p));
    if (!ok) {
      return res
        .status(403)
        .json({ message: "Forbidden: permission required" });
    }
    next();
  };
};
