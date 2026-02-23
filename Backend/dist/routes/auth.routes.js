import { Router } from "express";
import { register, login } from "../controllers/auth.controller.js";
const router = Router();
router.post("/register", register);
router.post("/login", login);
router.post("/logout", (req, res) => {
    res.clearCookie("access_token", { sameSite: "lax", secure: false });
    res.json({ message: "Logged out" });
});
export default router;
