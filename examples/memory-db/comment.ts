import { memoryStore } from './store';

export async function commentCreate(
  slug: string,
  commentContent: string,
  authorId: number,
) {
  // Verify article exists
  const article = memoryStore.getArticleBySlug(slug);
  if (!article) {
    throw new Error('Article not found');
  }

  const comment = memoryStore.createComment({
    body: commentContent,
    authorId,
    articleSlug: slug,
  });

  // Get author with followedBy data
  const author = memoryStore.getUserById(authorId);
  if (!author) {
    throw new Error('Author not found');
  }

  const followedBy = memoryStore.getUserFollowers(authorId)
    .map(id => memoryStore.getUserById(id))
    .filter(Boolean);

  return {
    ...comment,
    author: {
      ...author,
      followedBy,
    },
  };
}

export async function commentDelete(
  slug: string,
  commentId: number,
  authorId: number,
) {
  // Verify article exists
  const article = memoryStore.getArticleBySlug(slug);
  if (!article) {
    throw new Error('Article not found');
  }

  const comment = memoryStore.getCommentById(commentId);
  if (!comment || comment.articleSlug !== slug || comment.authorId !== authorId) {
    throw new Error('Comment not found or not authorized');
  }

  const deletedComment = memoryStore.deleteComment(commentId);
  if (!deletedComment) {
    throw new Error('Failed to delete comment');
  }

  // Get author with followedBy data
  const author = memoryStore.getUserById(authorId);
  if (!author) {
    throw new Error('Author not found');
  }

  const followedBy = memoryStore.getUserFollowers(authorId)
    .map(id => memoryStore.getUserById(id))
    .filter(Boolean);

  return {
    ...deletedComment,
    author: {
      ...author,
      followedBy,
    },
  };
}

export async function commentsGet(slug: string, currentUserId?: number) {
  // Verify article exists
  const article = memoryStore.getArticleBySlug(slug);
  if (!article) {
    throw new Error('Article not found');
  }

  const comments = memoryStore.getCommentsByArticle(slug);

  // Sort by creation date (newest first)
  comments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return await Promise.all(
    comments.map(async (comment) => {
      const author = memoryStore.getUserById(comment.authorId);
      if (!author) {
        throw new Error('Comment author not found');
      }

      const followedBy = memoryStore.getUserFollowers(comment.authorId)
        .map(id => memoryStore.getUserById(id))
        .filter(Boolean);

      return {
        ...comment,
        author: {
          ...author,
          followedBy,
        },
      };
    })
  );
}