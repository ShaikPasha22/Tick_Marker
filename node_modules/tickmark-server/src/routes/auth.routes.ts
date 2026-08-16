import { Router } from 'express';
import { register, login, getMe, updateMe, forgotPassword, resetPassword, deleteAccount } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, updateMe);
router.delete('/account', authenticate, deleteAccount);

export default router;
