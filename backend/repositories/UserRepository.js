/**
 * UserRepository Interface / Base Class
 * Defines the contract for user data operations.
 * Concrete implementations must implement all methods.
 */
export class UserRepository {
  async findById(id) {
    throw new Error('Method findById() must be implemented');
  }

  async findByUsername(username) {
    throw new Error('Method findByUsername() must be implemented');
  }

  async create(userData) {
    throw new Error('Method create() must be implemented');
  }

  async update(id, updateData) {
    throw new Error('Method update() must be implemented');
  }

  async updateOnlineStatus(id, isOnline, lastSeen) {
    throw new Error('Method updateOnlineStatus() must be implemented');
  }

  async searchUsers(query, currentUserId) {
    throw new Error('Method searchUsers() must be implemented');
  }

  async findAllExcept(currentUserId) {
    throw new Error('Method findAllExcept() must be implemented');
  }
}
