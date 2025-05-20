import { NextRouteFactory } from '@node-openapi/next';
import {
  createRequiredAuthFactory,
  createOptionalAuthFactory,
} from '../factories';
import {
  createCommentRoute,
  deleteCommentRoute,
  getCommentsRoute,
} from '../routes/comments.routes';
import {
  createComment,
  deleteComment,
  getComments,
} from 'ws-common/service/comments.service';
export const commentsController = new NextRouteFactory();

const checkedAuthFactory = createOptionalAuthFactory();

checkedAuthFactory.route(getCommentsRoute, async ({ input, context, h }) => {
  const slug = input.param.slug;
  const comments = await getComments(slug, context.user);

  return h.json({ data: { comments } });
});

const authFactory = createRequiredAuthFactory();

authFactory.route(createCommentRoute, async ({ input, context, h }) => {
  const { slug } = input.param;
  const { comment } = input.json;
  const newComment = await createComment(slug, comment.body, context.user);

  return h.json({ data: { comment: newComment }, status: 201 });
});

authFactory.route(deleteCommentRoute, async ({ input, context, h }) => {
  const { slug, id } = input.param;
  const deletedComment = await deleteComment(slug, id, context.user);

  return h.json({ data: { comment: deletedComment } });
});

commentsController.router('', checkedAuthFactory);
commentsController.router('', authFactory);
