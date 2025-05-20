import {
  articleCreate,
  ArticleDB,
  articleDelete,
  articleFavorite,
  articleFeed,
  articleGet,
  articlesList,
  articleUnFavorite,
  articleUpdate,
  TagDB,
  tagsCreate,
  UserDB,
  userGet,
} from 'ws-db';
import {
  Article,
  ArticleFeedQuery,
  ArticleQuery,
  NewArticle,
  UpdateArticle,
} from '../domain/article.domain';
import { User } from '../domain/user.domain';
import { toProfileView, UserWithFollow } from './user.service';
import { HttpError } from './error.service';

export async function createArticle(
  user: User,
  payload: NewArticle,
): Promise<Article> {
  let tags: TagDB[] = [];
  if (payload.tagList && payload.tagList.length > 0) {
    tags = await tagsCreate(payload.tagList);
  }

  const fullUser = await userGet(user.username);
  if (!fullUser) {
    throw new Error('User not found');
  }

  const article = await articleCreate(
    {
      title: payload.title,
      description: payload.description,
      body: payload.body,
    },
    tags,
    fullUser.id,
  );
  return toArticleView(article, fullUser);
}

export async function deleteArticle(user: User, slug: string) {
  const fullUser = await userGet(user.username);
  if (!fullUser) {
    throw new Error('User not found');
  }

  const article = await articleDelete(slug);
  return toArticleView(article, fullUser);
}

export async function favoriteArticle(user: User, slug: string) {
  const article = await articleFavorite(user.id, slug);
  if (!article) {
    throw new ArticleNotFoundError('Article not found');
  }

  const fullUser = await userGet(user.username);
  if (!fullUser) {
    throw new Error('User not found');
  }

  return toArticleView(article, fullUser);
}

export async function unfavoriteArticle(user: User, slug: string) {
  const article = await articleUnFavorite(user.id, slug);
  if (!article) {
    throw new ArticleNotFoundError('Article not found');
  }
  const fullUser = await userGet(user.username);
  if (!fullUser) {
    throw new Error('User not found');
  }
  return toArticleView(article, fullUser);
}

export async function getArticlesFeed(user: User, query: ArticleFeedQuery) {
  const fullUser = await userGet(user.username);
  if (!fullUser) {
    throw new Error('User not found');
  }

  const result = await articleFeed(fullUser.id, query.limit, query.offset);

  return {
    articles: result.articles.map((article) =>
      toArticleView(article, fullUser),
    ),
    articlesCount: result.articlesCount,
  };
}

export async function getArticles(user: User | null, query?: ArticleQuery) {
  const fullUser = user ? await userGet(user.username) : undefined;

  const result = await articlesList(
    query?.tag,
    query?.author,
    query?.favorited,
    query?.limit,
    query?.offset,
  );

  return {
    articles: result.articles.map((article) =>
      toArticleView(article, fullUser ?? undefined),
    ),
    articlesCount: result.articlesCount,
  };
}

export async function getArticle(slug: string, user: User | null) {
  const fullUser = user ? await userGet(user.username) : undefined;

  const article = await articleGet(slug);
  if (!article) {
    throw new ArticleNotFoundError('Article not found');
  }

  return toArticleView(article, fullUser ?? undefined);
}

export async function updateArticle(
  user: User,
  slug: string,
  payload: UpdateArticle,
) {
  const fullUser = await userGet(user.username);
  if (!fullUser) {
    throw new Error('User not found');
  }

  const article = await articleUpdate(fullUser.id, slug, payload);
  if (!article) {
    throw new ArticleNotFoundError('Article not found');
  }

  return toArticleView(article, fullUser);
}

type FullArticle = ArticleDB & {
  tagList: TagDB[];
  author: UserWithFollow;
  _count: { favoritedBy: number };
};

export function toArticleView(
  article: FullArticle,
  currentUser?: UserDB & { favorites: ArticleDB[] },
): Article {
  const favorited = currentUser
    ? currentUser.favorites.some((value) => value.slug === article.slug)
    : false;
  const tagListView = article.tagList.map((tag) => tag.tagName).sort();
  const authorView = toProfileView(article.author, currentUser);
  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    tagList: tagListView,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    author: authorView,
    favorited: favorited,
    favoritesCount: article._count.favoritedBy,
  };
}

export class ArticleNotFoundError extends HttpError {
  constructor(message: string) {
    super(message, 404);
  }
}
