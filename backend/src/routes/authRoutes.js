import { Router } from 'express';

import {
  login,
  me,
  register,
  updateProfile,
} from '../controllers/authController.js';

import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);

router.post('/login', login);

router.get('/me', authMiddleware, me);

router.patch('/profile', authMiddleware, updateProfile);

export default router;
