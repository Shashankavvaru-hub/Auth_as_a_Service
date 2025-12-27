export const resolveTokenTTLs = (app, env) => {
  return {
    accessTokenTTL: app.accessTokenTTL || env.jwt.accessTTL,
    refreshTokenTTL: app.refreshTokenTTL || env.jwt.refreshTTL,
  };
};
