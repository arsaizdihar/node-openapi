export * from './article';
export * from './comment';
export * from './tag';
export * from './user';
export {
  User as UserDB,
  Article as ArticleDB,
  Comment as CommentDB,
  Tag as TagDB,
} from './generated';
import { Prisma } from './generated';
export const PrismaClientKnownRequestError =
  Prisma.PrismaClientKnownRequestError;
