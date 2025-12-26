import "./src/config/env.js";
import { connectDB } from "./src/config/db.js";
import "./src/server.js";

await connectDB();
