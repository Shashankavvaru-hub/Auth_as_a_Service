import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { errorHandler } from "./middlewares/error.middleware.js";
import routes from "./routes.js";

const app = express();

// Core middlewares
app.use(express.json());
app.use(cookieParser());

// CORS (will be app-specific later)
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Routes
app.use("/api", routes);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
