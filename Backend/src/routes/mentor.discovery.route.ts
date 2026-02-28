import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  blockMentor,
  connectWithMentor,
  getConnectionMessages,
  getNextMentorMatch,
  listMentorConnections,
  respondToConnectionRequest,
  sendConnectionMessage,
  skipMentor,
} from "../controllers/mentor.discovery.controller.js";

const router = Router();

router.get("/match", requireAuth, getNextMentorMatch);
router.post("/connect", requireAuth, connectWithMentor);
router.post("/skip", requireAuth, skipMentor);
router.post("/block", requireAuth, blockMentor);
router.get("/connections", requireAuth, listMentorConnections);
router.post("/connections/:connectionId/respond", requireAuth, respondToConnectionRequest);
router.get("/connections/:connectionId/messages", requireAuth, getConnectionMessages);
router.post("/connections/:connectionId/messages", requireAuth, sendConnectionMessage);

export default router;
