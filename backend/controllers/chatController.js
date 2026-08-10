import { ChatService } from '../services/ChatService.js';
import { mediaRepository, conversationRepository, messageRepository } from '../repositories/index.js';
import { uploadToSupabaseStorage, generateSignedUrl } from '../config/storage.js';

export const getConversations = async (req, res) => {
  try {
    const conversations = await ChatService.getUserConversations(req.user.id);
    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrCreateConversation = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const conversation = await ChatService.getOrCreateConversation(req.user.id, recipientId);
    res.status(200).json(conversation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await ChatService.getConversationMessages(conversationId, req.user.id);
    res.status(200).json(messages);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { conversationId, text, type, mediaUrl, fileName, fileSize, fileType, replyTo } = req.body;
    const result = await ChatService.sendMessage({
      senderId: req.user.id,
      conversationId,
      text,
      type,
      mediaUrl,
      fileName,
      fileSize,
      fileType,
      replyTo
    });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload file buffer directly to PRIVATE Supabase Storage bucket
    const uploadedMedia = await uploadToSupabaseStorage({
      fileBuffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size
    });

    // Save media record metadata to repository
    const savedMedia = await mediaRepository.saveFile({
      filename: uploadedMedia.filename,
      originalname: uploadedMedia.originalName,
      mimetype: uploadedMedia.mimeType,
      size: uploadedMedia.size,
      url: uploadedMedia.url,
      type: uploadedMedia.type
    });

    res.status(200).json(savedMedia);
  } catch (error) {
    console.error('File upload controller error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Generates a short-lived signed URL for private media AFTER verifying authorization
 */
export const getSignedMediaUrl = async (req, res) => {
  try {
    const { mediaUrl, conversationId, messageId } = req.query;

    if (!mediaUrl && !messageId) {
      return res.status(400).json({ message: 'Media URL or Message ID is required' });
    }

    let targetConvId = conversationId;

    // If messageId is provided, look up the message to verify conversation ownership
    if (messageId && !targetConvId) {
      const msg = await messageRepository.findById(messageId);
      if (!msg) {
        return res.status(404).json({ message: 'Message not found' });
      }
      targetConvId = msg.conversationId;
    }

    if (!targetConvId) {
      return res.status(400).json({ message: 'Conversation ID required for media authorization check' });
    }

    // STRICT AUTHORIZATION CHECK: Verify requesting user is a participant of conversation
    const conversationRecord = await conversationRepository.findById(targetConvId);
    if (!conversationRecord || !conversationRecord.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden: Access Denied to private media resource' });
    }

    // User is authorized! Generate short-lived signed URL (1 hour expiry)
    const result = await generateSignedUrl(mediaUrl, 3600);
    res.status(200).json({
      success: true,
      signedUrl: result.signedUrl,
      expiresAt: result.expiresAt
    });
  } catch (error) {
    console.error('getSignedMediaUrl error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

export const deleteMessageForMe = async (req, res) => {
  try {
    const { messageId } = req.params;
    const result = await ChatService.deleteMessageForUser(messageId, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
