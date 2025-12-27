import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/me", authenticate, (req, res) => {
  res.json({
    userId: req.user.id,
    roles: req.user.roles,
  });
});
import { requireRole } from "../../middlewares/role.middleware.js";

router.post("/admin/secret", authenticate, requireRole("admin"), (req, res) => {
  res.json({ message: "Admin access granted" });
});
import { requirePermission } from "../../middlewares/permissions.middleware.js";
import { PERMISSIONS } from "../../constants/default-roles.js";

router.delete(
  "/admin/users/:id",
  authenticate,
  requirePermission(PERMISSIONS.USER_WRITE),
  (req, res) => {
    res.json({ message: "User deleted (example)" });
  }
);

export default router;
