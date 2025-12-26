export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    const roles = req.user?.roles || [];
    console.log(req.user);
    const ok = roles.some((r) => allowedRoles.includes(r));
    if (!ok) {
      return res.status(403).json({ message: "Forbidden: role required" });
    }
    next();
  };
};
