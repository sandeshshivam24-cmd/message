import express from 'express';
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  uploadFile,
  getSignedMediaUrl,
  deleteMessageForMe,
  deleteMessageForEveryone,
  clearConversation
} from '../controllers/chatController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { uploadMiddleware } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/conversations', authMiddleware, getConversations);
router.post('/conversations', authMiddleware, getOrCreateConversation);
router.post('/conversations/:conversationId/clear', authMiddleware, clearConversation);
router.get('/messages/:conversationId', authMiddleware, getMessages);
router.post('/messages', authMiddleware, sendMessage);
router.post('/upload', authMiddleware, uploadMiddleware.single('file'), uploadFile);
router.get('/media/signed-url', authMiddleware, getSignedMediaUrl);
router.delete('/messages/:messageId', authMiddleware, deleteMessageForMe);
router.delete('/messages/:messageId/everyone', authMiddleware, deleteMessageForEveryone);

export default router;
