import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  listActivities,
  createActivity,
  inviteToActivity,
  listInvitations,
  respondInvitation,
  logActivity,
  activityHistory,
  listNotifications,
  markNotificationRead,
} from "../controllers/foguinhoController.js";

const router = express.Router();
router.use(authMiddleware);
router.get("/activities", listActivities);
router.post("/activities", createActivity);
router.post("/activities/:id/invite", inviteToActivity);
router.get("/invitations", listInvitations);
router.patch("/invitations/:id", respondInvitation);
router.post("/activities/:id/log", logActivity);
router.get("/activities/:id/history", activityHistory);
router.get("/notifications", listNotifications);
router.patch("/notifications/:id/read", markNotificationRead);
export default router;
