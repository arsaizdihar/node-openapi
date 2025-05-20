import { commentCreate, CommentDB, commentDelete, commentsGet } from 'ws-db';
import { Comment } from '../domain/comment.domain';
import { User } from '../domain/user.domain';
import { toProfileView, UserWithFollow } from './user.service';

export async function createComment(
  slug: string,
  commentContent: string,
  currentUser: User,
) {
  const comment = await commentCreate(slug, commentContent, currentUser.id);
  return toCommentView(comment);
}

export async function deleteComment(
  slug: string,
  id: number,
  currentUser: User,
) {
  const comment = await commentDelete(slug, id, currentUser.id);
  return toCommentView(comment);
}

export async function getComments(slug: string, currentUser: User | null) {
  const comments = await commentsGet(slug, currentUser?.id);
  return comments.map((comment) => toCommentView(comment));
}

function toCommentView(
  comment: CommentDB & { author: UserWithFollow },
): Comment {
  return {
    id: comment.id,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    body: comment.body,
    author: toProfileView(comment.author),
  };
}
