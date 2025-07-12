// In-memory database types that match the Prisma schema

export interface UserDB {
  id: number;
  email: string;
  username: string;
  password: string;
  bio: string | null;
  image: string | null;
}

export interface ArticleDB {
  title: string;
  slug: string;
  description: string;
  body: string;
  authorId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentDB {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  body: string;
  authorId: number;
  articleSlug: string;
}

export interface TagDB {
  tagName: string;
}

// Relations stored separately for simplicity
export interface UserFollows {
  followerId: number;
  followedId: number;
}

export interface ArticleFavorite {
  userId: number;
  articleSlug: string;
}

export interface ArticleTag {
  articleSlug: string;
  tagName: string;
}