import { Router } from "express";
import { initiateKhaltiPayment, verifyKhaltiPayment } from "../controllers/payment.khalti.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
const router = Router();
router.post("/khalti/initiate", requireAuth, initiateKhaltiPayment);
router.post("/khalti/verify", requireAuth, verifyKhaltiPayment);
export default router;
