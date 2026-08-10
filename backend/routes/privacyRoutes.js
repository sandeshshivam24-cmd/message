import express from 'express';
import { blockUser, unblockUser, getBlockedUsers, reportUser } from '../controllers/privacyController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/block', authMiddleware, blockUser);
router.post('/unblock', authMiddleware, unblockUser);
router.get('/blocked', authMiddleware, getBlockedUsers);
router.post('/report', authMiddleware, reportUser);

export default router;
