import { Tag, User } from './generated';
import prisma from './prisma';
import { slugfy } from './slugfy';

interface CreateArticleFields {
  title: string;
  description: string;
  body: string;
}

interface UpdateArticleFields {
  title?: string;
  description?: string;
  body?: string;
}

export async function articleCreate(
  info: CreateArticleFields,
  tagList: Tag[],
  authorId: number,
) {
  const slug = slugfy(info.title);
  const article = await prisma.article.create({
    data: {
      ...info,
      slug,
      authorId,
      tagList: { connect: tagList },
    },
    include: {
      author: { include: { followedBy: true } },
      tagList: true,
      _count: { select: { favoritedBy: true } },
    },
  });
  return article;
}

export async function articleDelete(slug: string) {
  const article = await prisma.article.delete({
    where: { slug },
    include: {
      author: { include: { followedBy: true } },
      tagList: true,
      _count: { select: { favoritedBy: true } },
    },
  });
  return article;
}

export async function articleFavorite(currentUser: User, slug: string) {
  const article = await prisma.article.update({
    where: { slug },
    data: { favoritedBy: { connect: { username: currentUser.username } } },
    include: {
      tagList: true,
      author: {
        include: { followedBy: { where: { username: currentUser.username } } },
      },
      _count: { select: { favoritedBy: true } },
    },
  });
  return article;
}

export async function articleFeed(
  currentUser: User & { follows: User[] },
  limit = 20,
  offset = 0,
) {
  const articles = await prisma.article.findMany({
    include: {
      tagList: true,
      author: {
        include: { followedBy: { where: { id: currentUser.id } } },
      },
      _count: { select: { favoritedBy: true } },
    },
    take: limit,
    skip: offset,
  });

  const count = await prisma.article.count({
    where: {
      author: {
        followedBy: { some: { id: currentUser.id } },
      },
    },
  });

  return {
    articles,
    articlesCount: count,
  };
}

export async function articleGet(slug: string) {
  const article = await prisma.article.findUnique({
    where: { slug },
    include: {
      author: { include: { followedBy: true } },
      tagList: true,
      _count: { select: { favoritedBy: true } },
    },
  });
  return article;
}

export async function articlesList(
  tag?: string,
  authorUsername?: string,
  favorited?: string,
  limit = 20,
  offset = 0,
) {
  const articles = await prisma.article.findMany({
    where: {
      author: authorUsername ? { username: authorUsername } : undefined,
      tagList: tag ? { some: { tagName: tag } } : undefined,
      favoritedBy: favorited ? { some: { username: favorited } } : undefined,
    },
    take: limit,
    skip: offset,
    orderBy: { updatedAt: 'desc' },
    include: {
      author: { include: { followedBy: true } },
      tagList: true,
      _count: { select: { favoritedBy: true } },
    },
  });

  const count = await prisma.article.count({
    where: {
      author: authorUsername ? { username: authorUsername } : undefined,
      tagList: tag ? { some: { tagName: tag } } : undefined,
      favoritedBy: favorited ? { some: { username: favorited } } : undefined,
    },
  });

  return {
    articles,
    articlesCount: count,
  };
}

export async function articleUnFavorite(currentUser: User, slug: string) {
  const article = await prisma.article.update({
    where: { slug },
    data: { favoritedBy: { disconnect: { username: currentUser.username } } },
    include: {
      tagList: true,
      author: {
        include: { followedBy: { where: { username: currentUser.username } } },
      },
      _count: { select: { favoritedBy: true } },
    },
  });
  return article;
}

export async function articleUpdate(
  authorId: number,
  slug: string,
  info: UpdateArticleFields,
) {
  const article = await prisma.article.update({
    where: { slug, authorId },
    data: {
      ...info,
      updatedAt: new Date(),
    },
    include: {
      author: { include: { followedBy: true } },
      tagList: true,
      _count: { select: { favoritedBy: true } },
    },
  });
  return article;
}
