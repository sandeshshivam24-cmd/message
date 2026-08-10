import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/index.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'messenger_super_secret_jwt_key_2026';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await userRepository.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: User no longer exists' });
    }

    // Attach sanitized user to request
    const { passwordHash, ...sanitizedUser } = user;
    req.user = sanitizedUser;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

export const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication error: Missing token'));
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await userRepository.findById(decoded.userId);

    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    const { passwordHash, ...sanitizedUser } = user;
    socket.user = sanitizedUser;
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid token'));
  }
};
