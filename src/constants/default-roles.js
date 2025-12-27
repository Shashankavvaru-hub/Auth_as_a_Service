export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  VIEWER: "viewer",
};

export const PERMISSIONS = {
  USER_READ: "user:read",
  USER_WRITE: "user:write",
  APP_MANAGE: "app:manage",
};

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_WRITE,
    PERMISSIONS.APP_MANAGE,
  ],
  [ROLES.USER]: [PERMISSIONS.USER_READ],
  [ROLES.VIEWER]: [],
};