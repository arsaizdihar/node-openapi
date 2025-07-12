export * from './article';
export * from './comment';
export * from './tag';
export * from './user';
export * from './store';
export type {
  UserDB,
  ArticleDB,
  CommentDB,
  TagDB,
} from './types';

// Mock Prisma error for compatibility
export class PrismaClientKnownRequestError extends Error {
  code: string;
  
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.name = 'PrismaClientKnownRequestError';
  }
}