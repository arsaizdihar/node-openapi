import { CommentDB, UserDB } from 'ws-db';
import profileViewer from './profileViewer';

export default function commentViewer(
  comment: CommentDB & { author: UserDB & { followedBy: UserDB[] } },
  currentUser?: UserDB,
) {
  const commentView = {
    id: comment.id,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    body: comment.body,
    author: profileViewer(comment.author, currentUser),
  };
  return commentView;
}
