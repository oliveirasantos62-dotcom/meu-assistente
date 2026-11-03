import { Router } from "express";
import {
  getInvestmentDashboard,
  createInvestment,
  updateInvestment,
  deleteInvestment,
  saveSnapshot,
  saveSettings,
  migrateLocalInvestments,
  getInvestmentQuote,
} from "../controllers/investmentController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);
router.get("/dashboard", getInvestmentDashboard);
router.get("/quote/:symbol", getInvestmentQuote);
router.post("/migrate", migrateLocalInvestments);
router.post("/snapshots", saveSnapshot);
router.put("/settings", saveSettings);
router.post("/", createInvestment);
router.patch("/:id", updateInvestment);
router.delete("/:id", deleteInvestment);
export default router;
