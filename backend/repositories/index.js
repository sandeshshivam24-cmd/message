import { InMemoryUserRepository } from './inMemory/InMemoryUserRepository.js';
import { InMemoryMessageRepository } from './inMemory/InMemoryMessageRepository.js';
import { InMemoryConversationRepository } from './inMemory/InMemoryConversationRepository.js';
import { InMemoryMediaRepository } from './inMemory/InMemoryMediaRepository.js';
import { InMemoryBlockRepository } from './inMemory/InMemoryBlockRepository.js';
import { InMemoryReportRepository } from './inMemory/InMemoryReportRepository.js';

import { PostgresUserRepository } from './postgres/PostgresUserRepository.js';
import { PostgresMessageRepository } from './postgres/PostgresMessageRepository.js';
import { PostgresConversationRepository } from './postgres/PostgresConversationRepository.js';
import { PostgresMediaRepository } from './postgres/PostgresMediaRepository.js';
import { PostgresBlockRepository } from './postgres/PostgresBlockRepository.js';
import { PostgresReportRepository } from './postgres/PostgresReportRepository.js';

// Central Repository Instantiation (Dependency Injection container)
const isPostgresEnabled = Boolean(process.env.DATABASE_URL);

if (isPostgresEnabled) {
  console.log('🐘 PostgreSQL Database persistence active (DATABASE_URL configured)');
} else {
  console.log('📦 In-Memory Repository active');
}

export const userRepository = isPostgresEnabled
  ? new PostgresUserRepository()
  : new InMemoryUserRepository();

export const messageRepository = isPostgresEnabled
  ? new PostgresMessageRepository()
  : new InMemoryMessageRepository();

export const conversationRepository = isPostgresEnabled
  ? new PostgresConversationRepository()
  : new InMemoryConversationRepository();

export const mediaRepository = isPostgresEnabled
  ? new PostgresMediaRepository()
  : new InMemoryMediaRepository();

export const blockRepository = isPostgresEnabled
  ? new PostgresBlockRepository()
  : new InMemoryBlockRepository();

export const reportRepository = isPostgresEnabled
  ? new PostgresReportRepository()
  : new InMemoryReportRepository();
