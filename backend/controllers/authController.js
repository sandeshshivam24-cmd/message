import { AuthService } from '../services/AuthService.js';

export const register = async (req, res) => {
  try {
    const { username, displayName, password, avatarUrl } = req.body;
    const result = await AuthService.register({ username, displayName, password, avatarUrl });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await AuthService.login({ username, password });
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await AuthService.getCurrentUser(req.user.id);
    res.status(200).json(user);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { displayName, statusMessage, avatarUrl } = req.body;
    const updatedUser = await AuthService.updateProfile(req.user.id, {
      displayName,
      statusMessage,
      avatarUrl
    });
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
