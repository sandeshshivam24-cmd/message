# Database Connection Guide (Phase 1 -> Phase 2+)

This project uses the **Repository Pattern** to decouple business logic (Controllers & Services) from the storage layer.

Currently, the application uses **In-Memory Repositories**:
- `InMemoryUserRepository`
- `InMemoryMessageRepository`
- `InMemoryConversationRepository`

---

## How to Connect a Database (e.g., MongoDB, PostgreSQL, SQLite, MySQL)

### Step 1: Create Concrete Database Repository Classes
Create a new directory under `repositories/` (e.g., `repositories/mongodb/` or `repositories/prisma/`).

For example, `repositories/mongodb/MongoUserRepository.js`:
```js
import { UserRepository } from '../UserRepository.js';
import { UserModel } from './models/UserModel.js';

export class MongoUserRepository extends UserRepository {
  async findById(id) {
    return await UserModel.findById(id).lean();
  }

  async findByUsername(username) {
    return await UserModel.findOne({ username }).lean();
  }

  async create(userData) {
    const user = new UserModel(userData);
    await user.save();
    return user.toObject();
  }

  async update(id, updateData) {
    return await UserModel.findByIdAndUpdate(id, updateData, { new: true }).lean();
  }

  async searchUsers(query, currentUserId) {
    return await UserModel.find({
      _id: { $ne: currentUserId },
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { displayName: { $regex: query, $options: 'i' } }
      ]
    }).lean();
  }

  async findAllExcept(currentUserId) {
    return await UserModel.find({ _id: { $ne: currentUserId } }).lean();
  }
}
```

---

### Step 2: Update Repository Instantiation (`repositories/index.js`)

Simply update `repositories/index.js` to instantiate your new database repositories instead of the in-memory ones:

```js
// repositories/index.js
import { MongoUserRepository } from './mongodb/MongoUserRepository.js';
import { MongoMessageRepository } from './mongodb/MongoMessageRepository.js';
import { MongoConversationRepository } from './mongodb/MongoConversationRepository.js';

export const userRepository = new MongoUserRepository();
export const messageRepository = new MongoMessageRepository();
export const conversationRepository = new MongoConversationRepository();
```

---

### Key Advantage
**Zero lines of code inside `services/`, `controllers/`, `routes/`, or `sockets/` need to be changed!**
All application logic, authentication, and Socket.IO real-time flows continue working seamlessly.
