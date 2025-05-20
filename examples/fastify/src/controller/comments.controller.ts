import { FastifyRouteFactory } from '@node-openapi/fastify';
import {
  createComment,
  deleteComment,
  getComments,
} from 'ws-common/service/comments.service';
import {
  createOptionalAuthFactory,
  createRequiredAuthFactory,
} from '../factories';
import {
  createCommentRoute,
  deleteCommentRoute,
  getCommentsRoute,
} from '../routes/comments.routes';
export const commentsController = new FastifyRouteFactory();

const checkedAuthFactory = createOptionalAuthFactory();

checkedAuthFactory.route(getCommentsRoute, async ({ context, input, h }) => {
  const slug = input.param.slug;
  const comments = await getComments(slug, context.user);

  h.json({ data: { comments } });
});

const authFactory = createRequiredAuthFactory();

authFactory.route(createCommentRoute, async ({ context, input, h }) => {
  const { slug } = input.param;
  const { comment } = input.json;
  const newComment = await createComment(slug, comment.body, context.user);

  h.json({ data: { comment: newComment }, status: 201 });
});

authFactory.route(deleteCommentRoute, async ({ context, input, h }) => {
  const { slug, id } = input.param;
  const deletedComment = await deleteComment(slug, id, context.user);

  h.json({ data: { comment: deletedComment } });
});

commentsController.router('', checkedAuthFactory);
commentsController.router('', authFactory);
