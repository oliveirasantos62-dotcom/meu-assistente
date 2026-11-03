import { Router } from "express";
import {
  getInvestmentDashboard,
  createInvestment,
  updateInvestment,
  deleteInvestment,
  saveSnapshot,
  saveSettings,
  migrateLocalInvestments,
  getQuote,
} from "../controllers/investmentController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);
router.get("/dashboard", getInvestmentDashboard);
router.get("/quote/:symbol", getQuote);
router.post("/migrate", migrateLocalInvestments);
router.post("/", createInvestment);
router.patch("/:id", updateInvestment);
router.delete("/:id", deleteInvestment);
router.post("/snapshots", saveSnapshot);
router.put("/settings", saveSettings);
export default router;
