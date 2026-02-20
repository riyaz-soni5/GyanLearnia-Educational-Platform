import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";
import questionRoutes from "./routes/question.route.js";
import categoryRoutes from "./routes/category.route.js";
import imagesRoute from "./routes/images.routes.js";
import instructorDocRoutes from "./routes/instructorDoc.routes.js";
import adminVerificationRoutes from "./routes/adminVerification.route.js";
import instructorVerificationRoutes from "./routes/instructorVerification.route.js";
import adminUsersRoute from "./routes/admin.users.route.js";



const app = express();


app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api", imagesRoute);
app.use("/api", instructorDocRoutes);
app.use("/api", adminVerificationRoutes);
app.use("/api", instructorVerificationRoutes);
app.use("/api/admin", adminUsersRoute);

export default app;