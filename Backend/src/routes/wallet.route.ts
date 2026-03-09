import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  checkoutWallet,
  getWalletSummary,
  initiateWalletTopup,
  verifyWalletTopup,
} from "../controllers/wallet.controller.js";

const router = Router();

router.get("/me", requireAuth, getWalletSummary);
router.post("/topup/initiate", requireAuth, initiateWalletTopup);
router.post("/topup/verify", requireAuth, verifyWalletTopup);
router.post("/checkout", requireAuth, checkoutWallet);

export default router;
