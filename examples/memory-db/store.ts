import {
  UserDB,
  ArticleDB,
  CommentDB,
  TagDB,
  UserFollows,
  ArticleFavorite,
  ArticleTag,
} from './types';

// In-memory data store
class MemoryStore {
  private users = new Map<number, UserDB>();
  private usersByEmail = new Map<string, UserDB>();
  private usersByUsername = new Map<string, UserDB>();
  private articles = new Map<string, ArticleDB>(); // keyed by slug
  private comments = new Map<number, CommentDB>();
  private tags = new Map<string, TagDB>();
  
  // Relations
  private userFollows = new Set<string>(); // "followerId:followedId"
  private articleFavorites = new Set<string>(); // "userId:articleSlug"
  private articleTags = new Set<string>(); // "articleSlug:tagName"
  
  // Auto-increment counters
  private nextUserId = 1;
  private nextCommentId = 1;

  // Reset all data (useful for testing)
  reset() {
    this.users.clear();
    this.usersByEmail.clear();
    this.usersByUsername.clear();
    this.articles.clear();
    this.comments.clear();
    this.tags.clear();
    this.userFollows.clear();
    this.articleFavorites.clear();
    this.articleTags.clear();
    this.nextUserId = 1;
    this.nextCommentId = 1;
  }

  // User operations
  createUser(user: Omit<UserDB, 'id'>): UserDB {
    const newUser: UserDB = { ...user, id: this.nextUserId++ };
    this.users.set(newUser.id, newUser);
    this.usersByEmail.set(newUser.email, newUser);
    this.usersByUsername.set(newUser.username, newUser);
    return newUser;
  }

  getUserById(id: number): UserDB | null {
    return this.users.get(id) || null;
  }

  getUserByEmail(email: string): UserDB | null {
    return this.usersByEmail.get(email) || null;
  }

  getUserByUsername(username: string): UserDB | null {
    return this.usersByUsername.get(username) || null;
  }

  updateUser(id: number, updates: Partial<Omit<UserDB, 'id'>>): UserDB | null {
    const user = this.users.get(id);
    if (!user) return null;

    // Remove from secondary indexes if changing email/username
    if (updates.email && updates.email !== user.email) {
      this.usersByEmail.delete(user.email);
    }
    if (updates.username && updates.username !== user.username) {
      this.usersByUsername.delete(user.username);
    }

    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);

    // Update secondary indexes
    if (updates.email) {
      this.usersByEmail.set(updates.email, updatedUser);
    }
    if (updates.username) {
      this.usersByUsername.set(updates.username, updatedUser);
    }

    return updatedUser;
  }

  // User follows operations
  addUserFollow(followerId: number, followedId: number) {
    this.userFollows.add(`${followerId}:${followedId}`);
  }

  removeUserFollow(followerId: number, followedId: number) {
    this.userFollows.delete(`${followerId}:${followedId}`);
  }

  getUserFollows(userId: number): number[] {
    const follows: number[] = [];
    for (const follow of this.userFollows) {
      const [followerId, followedId] = follow.split(':').map(Number);
      if (followerId === userId) {
        follows.push(followedId);
      }
    }
    return follows;
  }

  getUserFollowers(userId: number): number[] {
    const followers: number[] = [];
    for (const follow of this.userFollows) {
      const [followerId, followedId] = follow.split(':').map(Number);
      if (followedId === userId) {
        followers.push(followerId);
      }
    }
    return followers;
  }

  isUserFollowing(followerId: number, followedId: number): boolean {
    return this.userFollows.has(`${followerId}:${followedId}`);
  }

  // Article operations
  createArticle(article: Omit<ArticleDB, 'createdAt' | 'updatedAt'>): ArticleDB {
    const now = new Date();
    const newArticle: ArticleDB = {
      ...article,
      createdAt: now,
      updatedAt: now,
    };
    this.articles.set(newArticle.slug, newArticle);
    return newArticle;
  }

  getArticleBySlug(slug: string): ArticleDB | null {
    return this.articles.get(slug) || null;
  }

  updateArticle(slug: string, updates: Partial<Omit<ArticleDB, 'slug' | 'createdAt'>>): ArticleDB | null {
    const article = this.articles.get(slug);
    if (!article) return null;

    const updatedArticle = {
      ...article,
      ...updates,
      updatedAt: new Date(),
    };
    this.articles.set(slug, updatedArticle);
    return updatedArticle;
  }

  deleteArticle(slug: string): ArticleDB | null {
    const article = this.articles.get(slug);
    if (!article) return null;

    this.articles.delete(slug);
    
    // Clean up relations
    for (const favorite of this.articleFavorites) {
      if (favorite.endsWith(`:${slug}`)) {
        this.articleFavorites.delete(favorite);
      }
    }
    for (const tag of this.articleTags) {
      if (tag.startsWith(`${slug}:`)) {
        this.articleTags.delete(tag);
      }
    }
    
    // Delete comments
    for (const [commentId, comment] of this.comments) {
      if (comment.articleSlug === slug) {
        this.comments.delete(commentId);
      }
    }

    return article;
  }

  getAllArticles(): ArticleDB[] {
    return Array.from(this.articles.values());
  }

  getArticlesByAuthor(authorId: number): ArticleDB[] {
    return Array.from(this.articles.values()).filter(a => a.authorId === authorId);
  }

  // Article favorites
  addArticleFavorite(userId: number, articleSlug: string) {
    this.articleFavorites.add(`${userId}:${articleSlug}`);
  }

  removeArticleFavorite(userId: number, articleSlug: string) {
    this.articleFavorites.delete(`${userId}:${articleSlug}`);
  }

  isArticleFavorited(userId: number, articleSlug: string): boolean {
    return this.articleFavorites.has(`${userId}:${articleSlug}`);
  }

  getArticleFavoritesCount(articleSlug: string): number {
    let count = 0;
    for (const favorite of this.articleFavorites) {
      if (favorite.endsWith(`:${articleSlug}`)) {
        count++;
      }
    }
    return count;
  }

  getUserFavoriteArticles(userId: number): string[] {
    const favorites: string[] = [];
    for (const favorite of this.articleFavorites) {
      const [uid, slug] = favorite.split(':');
      if (Number(uid) === userId) {
        favorites.push(slug);
      }
    }
    return favorites;
  }

  // Comment operations
  createComment(comment: Omit<CommentDB, 'id' | 'createdAt' | 'updatedAt'>): CommentDB {
    const now = new Date();
    const newComment: CommentDB = {
      ...comment,
      id: this.nextCommentId++,
      createdAt: now,
      updatedAt: now,
    };
    this.comments.set(newComment.id, newComment);
    return newComment;
  }

  getCommentById(id: number): CommentDB | null {
    return this.comments.get(id) || null;
  }

  getCommentsByArticle(articleSlug: string): CommentDB[] {
    return Array.from(this.comments.values()).filter(c => c.articleSlug === articleSlug);
  }

  deleteComment(id: number): CommentDB | null {
    const comment = this.comments.get(id);
    if (!comment) return null;
    this.comments.delete(id);
    return comment;
  }

  // Tag operations
  createTag(tagName: string): TagDB {
    const tag: TagDB = { tagName };
    this.tags.set(tagName, tag);
    return tag;
  }

  getTagByName(tagName: string): TagDB | null {
    return this.tags.get(tagName) || null;
  }

  getAllTags(): TagDB[] {
    return Array.from(this.tags.values());
  }

  // Article tags
  addArticleTag(articleSlug: string, tagName: string) {
    this.articleTags.add(`${articleSlug}:${tagName}`);
  }

  getArticleTags(articleSlug: string): string[] {
    const tags: string[] = [];
    for (const articleTag of this.articleTags) {
      const [slug, tag] = articleTag.split(':');
      if (slug === articleSlug) {
        tags.push(tag);
      }
    }
    return tags;
  }

  getArticlesByTag(tagName: string): string[] {
    const articles: string[] = [];
    for (const articleTag of this.articleTags) {
      const [slug, tag] = articleTag.split(':');
      if (tag === tagName) {
        articles.push(slug);
      }
    }
    return articles;
  }
}

// Singleton instance
export const memoryStore = new MemoryStore();