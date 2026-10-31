import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getAppData, putAppData } from '../controllers/appDataController.js';

const router = Router();
router.use(authMiddleware);
router.get('/', getAppData);
router.put('/', putAppData);

export default router;
