// Database adapter that switches between real DB and memory DB based on environment
const USE_MEMORY_DB = process.env.USE_MEMORY_DB === 'true';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const dbModule = USE_MEMORY_DB ? require('../memory-db') : require('ws-db');

// Re-export all database functions and types
export const {
  // User functions
  userCreate,
  userFollowProfile,
  userGet,
  userGetByEmail,
  userUnFollowProfile,
  userUpdate,

  // Article functions
  articleCreate,
  articleDelete,
  articleFavorite,
  articleUnFavorite,
  articleFeed,
  articlesList,
  articleGet,
  articleUpdate,

  // Comment functions
  commentCreate,
  commentDelete,
  commentsGet,

  // Tag functions
  tagsCreate,
  tagsGet,

  // Error class
  PrismaClientKnownRequestError,
} = dbModule;

// Re-export types
export type { UserDB, ArticleDB, CommentDB, TagDB } from 'ws-db';
