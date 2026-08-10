import { userRepository } from '../repositories/index.js';

export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      const users = await userRepository.findAllExcept(req.user.id);
      return res.status(200).json(users);
    }
    const users = await userRepository.searchUsers(q, req.user.id);
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await userRepository.findAllExcept(req.user.id);
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
