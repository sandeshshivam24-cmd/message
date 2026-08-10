import { UserRepository } from '../UserRepository.js';

export class InMemoryUserRepository extends UserRepository {
  constructor() {
    super();
    // Key: userId (string), Value: user object
    this.users = new Map();
  }

  async findById(id) {
    const user = this.users.get(id);
    if (!user) return null;
    return { ...user };
  }

  async findByUsername(username) {
    const lowerUsername = username.toLowerCase();
    for (const user of this.users.values()) {
      if (user.username.toLowerCase() === lowerUsername) {
        return { ...user };
      }
    }
    return null;
  }

  async create(userData) {
    const id = userData.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newUser = {
      id,
      username: userData.username,
      displayName: userData.displayName || userData.username,
      passwordHash: userData.passwordHash,
      avatarUrl: userData.avatarUrl || '',
      statusMessage: userData.statusMessage || 'Hey there! I am using Messenger.',
      isOnline: false,
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    this.users.set(id, newUser);
    return { ...newUser };
  }

  async update(id, updateData) {
    const user = this.users.get(id);
    if (!user) return null;
    
    const updatedUser = {
      ...user,
      ...updateData
    };
    this.users.set(id, updatedUser);
    return { ...updatedUser };
  }

  async searchUsers(query, currentUserId) {
    const q = query.toLowerCase().trim();
    const results = [];
    for (const user of this.users.values()) {
      if (user.id === currentUserId) continue;
      if (
        user.username.toLowerCase().includes(q) ||
        user.displayName.toLowerCase().includes(q)
      ) {
        const { passwordHash, ...userWithoutPassword } = user;
        results.push({ ...userWithoutPassword });
      }
    }
    return results;
  }

  async findAllExcept(currentUserId) {
    const results = [];
    for (const user of this.users.values()) {
      if (user.id === currentUserId) continue;
      const { passwordHash, ...userWithoutPassword } = user;
      results.push({ ...userWithoutPassword });
    }
    return results;
  }
}
