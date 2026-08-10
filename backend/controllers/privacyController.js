import { blockRepository, reportRepository, userRepository } from '../repositories/index.js';

export const blockUser = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ message: 'Target user ID is required' });
    
    await blockRepository.blockUser(req.user.id, targetUserId);
    res.status(200).json({ success: true, message: 'User blocked successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ message: 'Target user ID is required' });

    await blockRepository.unblockUser(req.user.id, targetUserId);
    res.status(200).json({ success: true, message: 'User unblocked successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getBlockedUsers = async (req, res) => {
  try {
    const blockedIds = await blockRepository.getBlockedUserIds(req.user.id);
    const users = [];
    for (const id of blockedIds) {
      const u = await userRepository.findById(id);
      if (u) {
        const { passwordHash, ...sanitized } = u;
        users.push(sanitized);
      }
    }
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const reportUser = async (req, res) => {
  try {
    const { reportedUserId, reason, details } = req.body;
    if (!reportedUserId || !reason) {
      return res.status(400).json({ message: 'Reported user ID and reason are required' });
    }

    const report = await reportRepository.createReport({
      reporterId: req.user.id,
      reportedUserId,
      reason,
      details
    });

    res.status(201).json({ success: true, report });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
