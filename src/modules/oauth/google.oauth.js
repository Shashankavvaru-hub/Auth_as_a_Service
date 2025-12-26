import { OAuth2Client } from "google-auth-library";
import { env } from "../../config/env.js";

const client = new OAuth2Client(env.google.clientId);

export const verifyGoogleIdToken = async (idToken) => {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: env.google.clientId,
  });
  const payload = ticket.getPayload();

  return {
    provider: "google",
    providerId: payload.sub,      // stable Google user id
    email: payload.email,
    emailVerified: payload.email_verified,
    name: payload.name,
    picture: payload.picture,
  };
};
