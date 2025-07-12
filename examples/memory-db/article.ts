import { memoryStore } from './store';
import { slugfy } from './slugfy';
import { TagDB } from './types';

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
  tagList: TagDB[],
  authorId: number,
) {
  const slug = slugfy(info.title);
  
  // Create the article
  const article = memoryStore.createArticle({
    ...info,
    slug,
    authorId,
  });

  // Add tags to the article
  for (const tag of tagList) {
    memoryStore.addArticleTag(slug, tag.tagName);
  }

  // Get author with followedBy data
  const author = memoryStore.getUserById(authorId);
  if (!author) {
    throw new Error('Author not found');
  }

  const followedBy = memoryStore.getUserFollowers(authorId)
    .map(id => memoryStore.getUserById(id))
    .filter(Boolean);

  const favoritesCount = memoryStore.getArticleFavoritesCount(slug);

  return {
    ...article,
    author: {
      ...author,
      followedBy,
    },
    tagList,
    _count: { favoritedBy: favoritesCount },
  };
}

export async function articleDelete(slug: string) {
  const article = memoryStore.getArticleBySlug(slug);
  if (!article) {
    throw new Error('Article not found');
  }

  // Get author with followedBy data before deletion
  const author = memoryStore.getUserById(article.authorId);
  if (!author) {
    throw new Error('Author not found');
  }

  const followedBy = memoryStore.getUserFollowers(article.authorId)
    .map(id => memoryStore.getUserById(id))
    .filter(Boolean);

  const tags = memoryStore.getArticleTags(slug)
    .map(tagName => memoryStore.getTagByName(tagName))
    .filter(Boolean);

  const favoritesCount = memoryStore.getArticleFavoritesCount(slug);

  // Delete the article
  const deletedArticle = memoryStore.deleteArticle(slug);

  return {
    ...deletedArticle!,
    author: {
      ...author,
      followedBy,
    },
    tagList: tags,
    _count: { favoritedBy: favoritesCount },
  };
}

export async function articleFavorite(userId: number, slug: string) {
  const article = memoryStore.getArticleBySlug(slug);
  if (!article) {
    return null;
  }

  memoryStore.addArticleFavorite(userId, slug);

  // Get author with followedBy data
  const author = memoryStore.getUserById(article.authorId);
  if (!author) {
    throw new Error('Author not found');
  }

  const followedBy = memoryStore.getUserFollowers(article.authorId)
    .map(id => memoryStore.getUserById(id))
    .filter(Boolean);

  const tags = memoryStore.getArticleTags(slug)
    .map(tagName => memoryStore.getTagByName(tagName))
    .filter(Boolean);

  const favoritesCount = memoryStore.getArticleFavoritesCount(slug);

  return {
    ...article,
    author: {
      ...author,
      followedBy,
    },
    tagList: tags,
    _count: { favoritedBy: favoritesCount },
  };
}

export async function articleUnFavorite(userId: number, slug: string) {
  const article = memoryStore.getArticleBySlug(slug);
  if (!article) {
    return null;
  }

  memoryStore.removeArticleFavorite(userId, slug);

  // Get author with followedBy data
  const author = memoryStore.getUserById(article.authorId);
  if (!author) {
    throw new Error('Author not found');
  }

  const followedBy = memoryStore.getUserFollowers(article.authorId)
    .map(id => memoryStore.getUserById(id))
    .filter(Boolean);

  const tags = memoryStore.getArticleTags(slug)
    .map(tagName => memoryStore.getTagByName(tagName))
    .filter(Boolean);

  const favoritesCount = memoryStore.getArticleFavoritesCount(slug);

  return {
    ...article,
    author: {
      ...author,
      followedBy,
    },
    tagList: tags,
    _count: { favoritedBy: favoritesCount },
  };
}

export async function articleFeed(
  userId: number,
  limit: number = 20,
  offset: number = 0,
) {
  // Get users that the current user follows
  const followedUserIds = memoryStore.getUserFollows(userId);
  
  // Get articles by followed users
  const allArticles = memoryStore.getAllArticles()
    .filter(article => followedUserIds.includes(article.authorId))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) // newest first
    .slice(offset, offset + limit);

  const articles = await Promise.all(
    allArticles.map(async (article) => {
      const author = memoryStore.getUserById(article.authorId)!;
      const followedBy = memoryStore.getUserFollowers(article.authorId)
        .map(id => memoryStore.getUserById(id))
        .filter(Boolean);

      const tags = memoryStore.getArticleTags(article.slug)
        .map(tagName => memoryStore.getTagByName(tagName))
        .filter(Boolean);

      const favoritesCount = memoryStore.getArticleFavoritesCount(article.slug);

      return {
        ...article,
        author: {
          ...author,
          followedBy,
        },
        tagList: tags,
        _count: { favoritedBy: favoritesCount },
      };
    })
  );

  const totalCount = memoryStore.getAllArticles()
    .filter(article => followedUserIds.includes(article.authorId)).length;

  return {
    articles,
    articlesCount: totalCount,
  };
}

export async function articlesList(
  tag?: string,
  author?: string,
  favorited?: string,
  limit: number = 20,
  offset: number = 0,
) {
  let filteredArticles = memoryStore.getAllArticles();

  // Filter by tag
  if (tag) {
    const articleSlugsWithTag = memoryStore.getArticlesByTag(tag);
    filteredArticles = filteredArticles.filter(article => 
      articleSlugsWithTag.includes(article.slug)
    );
  }

  // Filter by author
  if (author) {
    const authorUser = memoryStore.getUserByUsername(author);
    if (authorUser) {
      filteredArticles = filteredArticles.filter(article => 
        article.authorId === authorUser.id
      );
    } else {
      filteredArticles = []; // author not found
    }
  }

  // Filter by favorited by user
  if (favorited) {
    const favoritedUser = memoryStore.getUserByUsername(favorited);
    if (favoritedUser) {
      const favoritedSlugs = memoryStore.getUserFavoriteArticles(favoritedUser.id);
      filteredArticles = filteredArticles.filter(article => 
        favoritedSlugs.includes(article.slug)
      );
    } else {
      filteredArticles = []; // favorited user not found
    }
  }

  // Sort by newest first
  filteredArticles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const totalCount = filteredArticles.length;
  const paginatedArticles = filteredArticles.slice(offset, offset + limit);

  const articles = await Promise.all(
    paginatedArticles.map(async (article) => {
      const author = memoryStore.getUserById(article.authorId)!;
      const followedBy = memoryStore.getUserFollowers(article.authorId)
        .map(id => memoryStore.getUserById(id))
        .filter(Boolean);

      const tags = memoryStore.getArticleTags(article.slug)
        .map(tagName => memoryStore.getTagByName(tagName))
        .filter(Boolean);

      const favoritesCount = memoryStore.getArticleFavoritesCount(article.slug);

      return {
        ...article,
        author: {
          ...author,
          followedBy,
        },
        tagList: tags,
        _count: { favoritedBy: favoritesCount },
      };
    })
  );

  return {
    articles,
    articlesCount: totalCount,
  };
}

export async function articleGet(slug: string) {
  const article = memoryStore.getArticleBySlug(slug);
  if (!article) {
    return null;
  }

  const author = memoryStore.getUserById(article.authorId);
  if (!author) {
    throw new Error('Author not found');
  }

  const followedBy = memoryStore.getUserFollowers(article.authorId)
    .map(id => memoryStore.getUserById(id))
    .filter(Boolean);

  const tags = memoryStore.getArticleTags(slug)
    .map(tagName => memoryStore.getTagByName(tagName))
    .filter(Boolean);

  const favoritesCount = memoryStore.getArticleFavoritesCount(slug);

  return {
    ...article,
    author: {
      ...author,
      followedBy,
    },
    tagList: tags,
    _count: { favoritedBy: favoritesCount },
  };
}

export async function articleUpdate(
  authorId: number,
  slug: string,
  payload: UpdateArticleFields,
) {
  const article = memoryStore.getArticleBySlug(slug);
  if (!article || article.authorId !== authorId) {
    return null;
  }

  // Create new slug if title is updated
  let newSlug = slug;
  if (payload.title) {
    newSlug = slugfy(payload.title);
    
    // If slug changed, we need to update all references
    if (newSlug !== slug) {
      // Delete old article and create new one with new slug
      const tags = memoryStore.getArticleTags(slug);
      memoryStore.deleteArticle(slug);
      
      const updatedArticle = memoryStore.createArticle({
        title: payload.title,
        description: payload.description || article.description,
        body: payload.body || article.body,
        slug: newSlug,
        authorId: article.authorId,
      });

      // Re-add tags
      for (const tagName of tags) {
        memoryStore.addArticleTag(newSlug, tagName);
      }
      
      slug = newSlug;
    }
  }

  const updatedArticle = memoryStore.updateArticle(slug, payload);
  if (!updatedArticle) {
    return null;
  }

  const author = memoryStore.getUserById(updatedArticle.authorId);
  if (!author) {
    throw new Error('Author not found');
  }

  const followedBy = memoryStore.getUserFollowers(updatedArticle.authorId)
    .map(id => memoryStore.getUserById(id))
    .filter(Boolean);

  const tags = memoryStore.getArticleTags(slug)
    .map(tagName => memoryStore.getTagByName(tagName))
    .filter(Boolean);

  const favoritesCount = memoryStore.getArticleFavoritesCount(slug);

  return {
    ...updatedArticle,
    author: {
      ...author,
      followedBy,
    },
    tagList: tags,
    _count: { favoritedBy: favoritesCount },
  };
}