import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  listProjects, createProject, updateProject, deleteProject,
  listMembers, inviteMember, listInvitations, respondInvitation,
  listTasks, createTask, updateTask, deleteTask, taskHistory,
} from "../controllers/projectController.js";

const router = express.Router();
router.use(authMiddleware);
router.get("/", listProjects);
router.post("/", createProject);
router.patch("/:id", updateProject);
router.delete("/:id", deleteProject);
router.get("/:id/members", listMembers);
router.post("/:id/invite", inviteMember);
router.get("/invitations/pending", listInvitations);
router.patch("/invitations/:id", respondInvitation);
router.get("/:id/tasks", listTasks);
router.post("/:id/tasks", createTask);
router.patch("/:projectId/tasks/:taskId", updateTask);
router.delete("/:projectId/tasks/:taskId", deleteTask);
router.get("/:projectId/tasks/:taskId/history", taskHistory);
export default router;
