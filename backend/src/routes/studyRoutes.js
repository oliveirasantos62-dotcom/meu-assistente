import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getStudyDashboard, createStudySession, createReading, updateReading, createReview, reviewItem, createStudyError, toggleStudyError } from '../controllers/studyController.js';

const router = Router();
router.use(authMiddleware);
router.get('/dashboard', getStudyDashboard);
router.post('/sessions', createStudySession);
router.post('/readings', createReading);
router.patch('/readings/:id', updateReading);
router.post('/reviews', createReview);
router.post('/reviews/:id/review', reviewItem);
router.post('/errors', createStudyError);
router.patch('/errors/:id/toggle', toggleStudyError);
export default router;
