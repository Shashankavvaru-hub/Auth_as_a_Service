#  Auth-as-a-Service Platform (Auth0-Lite)

A **production-grade, multi-tenant authentication platform** built with **Node.js**, **Express**, and **MongoDB**. This service focuses on secure, correct authentication, token lifecycle management, and authorization for multiple client applications (multi-tenant).

---

##  Quick summary

- Email/password auth (bcrypt)
- Google OAuth (OpenID Connect)
- JWT access tokens + rotating refresh tokens
- Multi-tenant: per-client app credentials & TTLs
- RBAC and permission middleware
- Audit logging for security events

---

##  Quickstart

Prerequisites: Node.js (16+), npm, MongoDB.

Install dependencies:

```bash
npm install
```

Run in development:

```bash
npm run dev
```

Run production:

```bash
npm start
```

The API root is `/api` (e.g., `http://localhost:3000/api`).

---

##  Environment variables (example `.env`)

Create a `.env` file with the following values:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/auth-service
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
ACCESS_TOKEN_TTL=10m
REFRESH_TOKEN_TTL=30d
BCRYPT_ROUNDS=12
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/oauth/google/callback
```

Notes:
- Keep JWT secrets and app secrets private and rotate regularly.
- Use HTTPS and set cookie `secure: true` in production.

---

##  How authentication works

- Client apps must include `x-app-id` and `x-app-secret` headers for app authentication.
- `/api/auth/login` returns an access token (JSON) and sets a `refreshToken` cookie (HttpOnly, path `/api/auth/refresh`).
- Use `Authorization: Bearer <accessToken>` for protected endpoints.
- Refresh tokens are hashed server-side and rotated on each use.

---

##  API overview (high level)

Base: `/api`

Auth endpoints:
- `POST /api/auth/register`  body `{ email, password }` (requires app headers)
- `POST /api/auth/login`  body `{ email, password }` (returns `accessToken` + `refreshToken` cookie)
- `POST /api/auth/refresh`  rotates the refresh token (requires refresh cookie)
- `POST /api/auth/logout`  revokes current refresh token and clears cookie
- `POST /api/auth/logout-all`  revokes all user sessions (requires authenticated user)
- `GET /api/auth/oauth/google`  redirect to Google (app headers required)
- `POST /api/auth/oauth/google/callback`  accepts Google `idToken` and issues tokens

User endpoints:
- `GET /api/users/me`  returns user info (requires `Authorization` header)
- Admin/permission-protected routes under `/api/users/admin/*` as examples

---

##  Database models (summary)

### User
```js
{
  email: string,
  passwordHash?: string,
  isEmailVerified: boolean,
  roles: string[],
  oauthProviders: Array<{ provider: string, providerUserId: string }>,
  appId: ObjectId
}
```

### ClientApp
```js
{
  appId: string,
  appSecretHash: string,
  name: string,
  allowedOrigins: string[],
  accessTokenTTL: string,
  refreshTokenTTL: string
}
```

### RefreshToken
```js
{
  userId: ObjectId,
  appId: ObjectId,
  tokenHash: string,
  expiresAt: Date,
  isRevoked: boolean
}
```

### AuditLog
```js
{
  userId?: ObjectId,
  appId?: ObjectId,
  action: string,
  ip?: string,
  userAgent?: string,
  createdAt: Date
}
```

---

##  Security decisions

- Passwords are stored hashed via `bcrypt`.
- Refresh tokens are stored hashed; rotation and reuse detection are implemented.
- Access tokens are short-lived and stateless.
- Tokens and users are scoped per client app.
- OAuth tokens are verified server-side (Google ID tokens).
- Error messages avoid user enumeration.

##  Threats mitigated

| Threat | Mitigation |
|---|---|
| Refresh token theft | Rotation + reuse detection |
| Access token theft | Short access token TTL |
| Brute force login | Rate-limiting (configurable) |
| Cross-app token misuse | App-scoped JWTs |
| OAuth abuse | Server-side verification |

---

##  Tech stack

- Node.js
- Express
- MongoDB (Mongoose)
- JSON Web Tokens (JWT)
- bcrypt
- Google Identity Services
- dotenv

---

## Contributing

PRs welcome. For larger changes, open an issue first.

---

## License

ISC
