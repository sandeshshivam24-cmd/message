import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/index.js';
import { JWT_SECRET } from '../middleware/authMiddleware.js';

export class AuthService {
  static async register({ username, displayName, password, avatarUrl }) {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    if (username.length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }

    if (password.length < 4) {
      throw new Error('Password must be at least 4 characters long');
    }

    const existingUser = await userRepository.findByUsername(username);
    if (existingUser) {
      throw new Error('Username is already taken');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userRepository.create({
      username,
      displayName: displayName || username,
      passwordHash,
      avatarUrl: avatarUrl || ''
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    const { passwordHash: _, ...sanitizedUser } = user;

    return { user: sanitizedUser, token };
  }

  static async login({ username, password }) {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    const user = await userRepository.findByUsername(username);
    if (!user) {
      throw new Error('Invalid username or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid username or password');
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    const { passwordHash: _, ...sanitizedUser } = user;

    return { user: sanitizedUser, token };
  }

  static async updateProfile(userId, { displayName, statusMessage, avatarUrl }) {
    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (statusMessage !== undefined) updateData.statusMessage = statusMessage;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    const updatedUser = await userRepository.update(userId, updateData);
    if (!updatedUser) {
      throw new Error('User not found');
    }

    const { passwordHash: _, ...sanitizedUser } = updatedUser;
    return sanitizedUser;
  }

  static async getCurrentUser(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('User not found');
    const { passwordHash: _, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}
