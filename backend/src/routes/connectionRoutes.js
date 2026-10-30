import { Router } from "express";
import {
  createConnection,
  listConnections,
  searchUsers,
  updateConnection,
} from "../controllers/connectionController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.use(authMiddleware);

router.get("/", listConnections);
router.get("/search", searchUsers);
router.post("/", createConnection);
router.patch("/:id", updateConnection);

export default router;
