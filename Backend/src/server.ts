// src/server.ts
import "dotenv/config"; // ✅ loads env BEFORE anything else (ESM-safe)

import app from "./app.js";
import { connectDB } from "./config/db.js";

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});